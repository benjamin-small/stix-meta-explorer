use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use wasm_bindgen::prelude::*;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: String,
    pub title: String,
    pub text: String,
    pub source: String,
    pub kind: String,
    pub object_types: Vec<String>,
    #[serde(default)]
    pub aliases: Vec<String>,
    #[serde(default)]
    pub property: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Corpus {
    schema_version: u32,
    documents: Vec<Document>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Retrieval {
    pub entity_ids: Vec<String>,
    pub facts: Vec<Document>,
    pub ambiguity: Vec<String>,
    pub notice: Option<String>,
}
fn words(s: &str) -> Vec<String> {
    s.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| {
            match s {
                "targets" => "target",
                "uses" => "use",
                "indicates" => "indicate",
                "mitigates" => "mitigate",
                "relationships" => "relationship",
                "enums" | "enum" => "enumeration",
                "vocabularies" => "vocabulary",
                "revoking" | "revocation" => "revoked",
                "mandatory" | "minimum" | "minimal" => "required",
                _ => s,
            }
            .to_owned()
        })
        .collect()
}
fn phrase(tokens: &[String], s: &str) -> bool {
    let p = words(s);
    !p.is_empty() && tokens.windows(p.len()).any(|w| w == p)
}

#[wasm_bindgen]
pub struct StixKnowledge {
    docs: Vec<Document>,
    terms: Vec<BTreeSet<String>>,
    idf: BTreeMap<String, f64>,
}
#[wasm_bindgen]
impl StixKnowledge {
    #[wasm_bindgen(constructor)]
    pub fn new(json: &str) -> Result<StixKnowledge, String> {
        if json.len() > 8_000_000 {
            return Err("STIX reference exceeds 8 MB.".into());
        }
        let corpus: Corpus = serde_json::from_str(json).map_err(|e| e.to_string())?;
        if corpus.schema_version != 1
            || corpus.documents.is_empty()
            || corpus.documents.len() > 10_000
        {
            return Err("Unsupported or empty STIX reference.".into());
        }
        let mut ids = BTreeSet::new();
        for d in &corpus.documents {
            if !ids.insert(&d.id)
                || d.text.len() > 12_000
                || d.text.is_empty()
                || !(d.source.starts_with("https://docs.oasis-open.org/")
                    || d.source.starts_with("https://github.com/oasis-open/"))
            {
                return Err("Invalid STIX reference entry.".into());
            }
        }
        let terms: Vec<BTreeSet<String>> = corpus
            .documents
            .iter()
            .map(|d| {
                words(&format!("{} {} {}", d.title, d.text, d.aliases.join(" ")))
                    .into_iter()
                    .collect()
            })
            .collect();
        let mut counts = BTreeMap::<String, usize>::new();
        for set in &terms {
            for word in set {
                *counts.entry(word.clone()).or_default() += 1;
            }
        }
        let idf = counts
            .into_iter()
            .map(|(w, n)| {
                (
                    w,
                    (1.0 + corpus.documents.len() as f64 / (1 + n) as f64).ln(),
                )
            })
            .collect();
        Ok(Self {
            docs: corpus.documents,
            terms,
            idf,
        })
    }
    pub fn retrieve(&self, query: &str, previous: &str) -> Result<String, String> {
        if query.len() > 16_000 {
            return Err("Shorten the question to fewer than 16,000 characters.".into());
        }
        let previous: Vec<String> = serde_json::from_str(previous).map_err(|e| e.to_string())?;
        serde_json::to_string(&self.search(query, &previous)).map_err(|e| e.to_string())
    }
}
impl StixKnowledge {
    pub fn search(&self, query: &str, previous: &[String]) -> Retrieval {
        let tokens = words(query);
        let mut matched: Vec<String> = self
            .docs
            .iter()
            .filter(|d| d.kind == "overview")
            .filter(|d| {
                phrase(&tokens, &d.object_types[0]) || d.aliases.iter().any(|a| phrase(&tokens, a))
            })
            .map(|d| d.object_types[0].clone())
            .collect();
        // "malware analysis" must not also select "malware"; independent types remain.
        let all = matched.clone();
        matched.retain(|t| {
            !all.iter()
                .any(|other| other != t && phrase(&words(other), t))
        });
        if matched.is_empty()
            && tokens.iter().any(|t| {
                [
                    "it", "its", "they", "their", "this", "that", "those", "these",
                ]
                .contains(&t.as_str())
            })
        {
            matched = previous.to_vec();
        }
        let required = tokens
            .iter()
            .any(|t| ["required", "mandatory", "minimum", "minimal"].contains(&t.as_str()));
        let relation = tokens.iter().any(|t| {
            [
                "relationship",
                "relationships",
                "relate",
                "relates",
                "connect",
                "connects",
                "link",
                "links",
                "indicates",
                "uses",
                "targets",
                "mitigates",
                "direction",
                "source",
                "target",
            ]
            .contains(&t.as_str())
        });
        let mut property_tokens = tokens.clone();
        for d in self
            .docs
            .iter()
            .filter(|d| d.kind == "overview" && matched.contains(&d.object_types[0]))
        {
            for alias in std::iter::once(&d.object_types[0]).chain(d.aliases.iter()) {
                let name = words(alias);
                if name.len() < 2 || name.len() > tokens.len() {
                    continue;
                }
                for start in 0..=tokens.len() - name.len() {
                    if tokens[start..start + name.len()] == name {
                        for token in &mut property_tokens[start..start + name.len()] {
                            token.clear();
                        }
                    }
                }
            }
        }
        let mut properties: BTreeSet<_> = self
            .docs
            .iter()
            .filter(|d| !d.property.is_empty() && phrase(&property_tokens, &d.property))
            .map(|d| d.property.as_str())
            .collect();
        if matched.is_empty() {
            properties.retain(|p| {
                !["type", "name", "version", "schema", "value", "description"].contains(p)
            });
        }
        let all_properties = properties.clone();
        properties.retain(|p| {
            !all_properties
                .iter()
                .any(|other| other != p && phrase(&words(other), p))
        });
        let has_specific_property = self.docs.iter().any(|d| {
            properties.contains(d.property.as_str())
                && d.object_types.iter().any(|t| matched.contains(t))
        });
        let stop = [
            "what", "which", "how", "is", "are", "a", "an", "the", "of", "for", "to", "in", "on",
            "and", "does", "do", "can", "i", "me", "tell", "about", "stix", "21", "2", "1", "it",
            "its", "please",
        ];
        let query_words: BTreeSet<_> = tokens
            .iter()
            .filter(|t| !stop.contains(&t.as_str()))
            .cloned()
            .collect();
        let mut ranked: Vec<(f64, usize)> = self
            .docs
            .iter()
            .enumerate()
            .map(|(i, d)| {
                let lexical: f64 = query_words
                    .intersection(&self.terms[i])
                    .map(|w| self.idf[w])
                    .sum();
                let object_matches = matched
                    .iter()
                    .filter(|t| d.object_types.contains(t))
                    .count();
                let mut score = lexical;
                if !matched.is_empty() {
                    if object_matches == 0 && d.kind != "concept" && !d.object_types.is_empty() {
                        score -= 70.0;
                    } else {
                        score += 14.0 * object_matches as f64;
                    }
                }
                if !properties.is_empty() {
                    if properties.contains(d.property.as_str()) {
                        score += 45.0;
                        if matched.is_empty() && d.object_types.is_empty() {
                            score += 30.0;
                        }
                    } else {
                        score -= 20.0;
                    }
                } else if required {
                    score += if d.kind == "required" { 45.0 } else { -8.0 };
                } else if relation {
                    score += if d.kind == "relationship" { 18.0 } else { 0.0 };
                    if d.kind == "relationship"
                        && phrase(&tokens, d.id.rsplit('.').next().unwrap_or(""))
                    {
                        score += 45.0;
                    }
                } else if d.kind == "overview" && object_matches > 0 {
                    score += 14.0;
                }
                if d.aliases.iter().any(|a| phrase(&tokens, a)) {
                    score += 18.0;
                }
                if d.kind == "concept"
                    && d.aliases.iter().any(|a| {
                        phrase(&tokens, a)
                            && (properties.is_empty()
                                || matched.is_empty()
                                || tokens.iter().any(|t| t == "custom")
                                || (!has_specific_property && words(a).len() > 1))
                    })
                {
                    score += 85.0;
                }
                (score, i)
            })
            .filter(|(s, _)| *s > 2.0)
            .collect();
        ranked.sort_by(|a, b| {
            b.0.total_cmp(&a.0)
                .then_with(|| self.docs[a.1].id.cmp(&self.docs[b.1].id))
        });
        if let Some((_, i)) = ranked.first() {
            if self.docs[*i].kind == "concept"
                && self.docs[*i].aliases.iter().any(|a| phrase(&tokens, a))
            {
                ranked.truncate(1);
            } else if !properties.is_empty() && properties.contains(self.docs[*i].property.as_str())
            {
                let has_specific = ranked.iter().any(|(_, i)| {
                    properties.contains(self.docs[*i].property.as_str())
                        && self.docs[*i]
                            .object_types
                            .iter()
                            .any(|t| matched.contains(t))
                });
                let has_common = ranked.iter().any(|(_, i)| {
                    properties.contains(self.docs[*i].property.as_str())
                        && self.docs[*i].object_types.is_empty()
                });
                ranked.retain(|(_, i)| {
                    properties.contains(self.docs[*i].property.as_str())
                        && if has_specific {
                            self.docs[*i]
                                .object_types
                                .iter()
                                .any(|t| matched.contains(t))
                        } else if matched.is_empty() && has_common {
                            self.docs[*i].object_types.is_empty()
                        } else {
                            true
                        }
                });
            }
        }
        let facts = ranked
            .into_iter()
            .take(4)
            .map(|(_, i)| self.docs[i].clone())
            .collect::<Vec<_>>();
        Retrieval {
            entity_ids: matched,
            notice: if facts.is_empty() {
                Some("No supporting STIX reference was found. Say what is unknown; do not invent schema rules.".into())
            } else {
                None
            },
            facts,
            ambiguity: vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn index() -> StixKnowledge {
        StixKnowledge::new(include_str!("../../../public/stix-agent/knowledge.json")).unwrap()
    }
    #[test]
    fn specific_properties_and_followups() {
        let k = index();
        assert_eq!(
            k.search("Is name required for malware?", &[]).facts[0].id,
            "malware.name"
        );
        let r = k.search("Which fields are required for an indicator?", &[]);
        assert_eq!(r.facts[0].id, "indicator.required");
        assert_eq!(
            k.search("What about its pattern_type?", &r.entity_ids)
                .facts[0]
                .id,
            "indicator.pattern_type"
        );
    }
    #[test]
    fn matches_two_types_without_substring_confusion() {
        let k = index();
        assert_eq!(
            k.search("What is malware analysis?", &[]).entity_ids,
            vec!["malware-analysis"]
        );
        let r = k.search("How does an indicator relate to malware?", &[]);
        assert!(r.facts.iter().any(|d| d.id == "rel.indicator.indicates"));
        assert_eq!(r.entity_ids.len(), 2);
    }
    #[test]
    fn rejects_bad_corpus_and_empty_matches() {
        assert!(StixKnowledge::new("{}").is_err());
        assert!(index().search("zzzxxyz", &[]).facts.is_empty());
    }
    #[test]
    fn scopes_common_rules_and_specific_fields() {
        let k = index();
        for (q, id) in [
            ("What is the allowed confidence range?", "common.confidence"),
            (
                "Can I create another version after revoking an object?",
                "concept.versioning",
            ),
            (
                "Is spec_version mandatory on an IPv4 address SCO?",
                "ipv4-addr.spec_version",
            ),
            (
                "Explain object_marking_refs on directory.",
                "directory.object_marking_refs",
            ),
            (
                "Tell me about the type field of extension-definition.",
                "extension-definition.type",
            ),
            (
                "Explain created_by_ref on course-of-action.",
                "course-of-action.created_by_ref",
            ),
        ] {
            let r = k.search(q, &[]);
            assert_eq!(r.facts[0].id, id, "{q}");
            assert_eq!(r.facts.len(), 1, "{q}");
        }
    }
}
