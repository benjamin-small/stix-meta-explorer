use std::io::{self, BufRead};
use stix_agent_core::StixKnowledge;
fn main() {
    let path = std::env::args()
        .nth(1)
        .expect("usage: stix-agent-core knowledge.json < queries.jsonl");
    let index = StixKnowledge::new(&std::fs::read_to_string(path).unwrap()).unwrap();
    for line in io::stdin().lock().lines() {
        let v: serde_json::Value = serde_json::from_str(&line.unwrap()).unwrap();
        let previous = v.get("previous").cloned().unwrap_or(serde_json::json!([]));
        println!(
            "{}",
            index
                .retrieve(v["query"].as_str().unwrap(), &previous.to_string())
                .unwrap()
        );
    }
}
