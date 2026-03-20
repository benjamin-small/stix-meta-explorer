import type { StixObjectType, Property } from '../types/stix';

const SPEC_BASE = 'https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html';

// ---------------------------------------------------------------------------
// Common property helpers
// ---------------------------------------------------------------------------

const sdoCommonProps: Property[] = [
  { name: 'type', type: 'string', required: true, description: 'The type property identifies the type of STIX Object.', isCommon: true, isInteresting: false },
  { name: 'spec_version', type: 'string', required: true, description: 'The version of the STIX specification used to represent this object.', isCommon: true, isInteresting: false },
  { name: 'id', type: 'identifier', required: true, description: 'The id property universally and uniquely identifies this object.', isCommon: true, isInteresting: false },
  { name: 'created_by_ref', type: 'identifier', required: false, description: 'The ID of the identity that created this object.', isCommon: true, isInteresting: false },
  { name: 'created', type: 'timestamp', required: true, description: 'The time at which the object was originally created.', isCommon: true, isInteresting: false },
  { name: 'modified', type: 'timestamp', required: true, description: 'The time at which this particular version of the object was last modified.', isCommon: true, isInteresting: false },
  { name: 'revoked', type: 'boolean', required: false, description: 'Indicates whether the object has been revoked.', isCommon: true, isInteresting: false },
  { name: 'labels', type: 'list of string', required: false, description: 'The labels property specifies a set of terms describing this object.', isCommon: true, isInteresting: false },
  { name: 'confidence', type: 'integer', required: false, description: 'Identifies the confidence that the creator has in the correctness of their data (0-100).', isCommon: true, isInteresting: false },
  { name: 'lang', type: 'string', required: false, description: 'The language of the text content in this object.', isCommon: true, isInteresting: false },
  { name: 'external_references', type: 'list of external-reference', required: false, description: 'A list of external references which refer to non-STIX information.', isCommon: true, isInteresting: false },
  { name: 'object_marking_refs', type: 'list of identifier', required: false, description: 'The list of marking-definition objects to be applied to this object.', isCommon: true, isInteresting: false },
  { name: 'granular_markings', type: 'list of granular-marking', required: false, description: 'The set of granular markings that apply to this object.', isCommon: true, isInteresting: false },
  { name: 'extensions', type: 'dictionary', required: false, description: 'Specifies any extensions of the object.', isCommon: true, isInteresting: false },
];

const sroCommonProps: Property[] = [...sdoCommonProps];

const scoCommonProps: Property[] = [
  { name: 'type', type: 'string', required: true, description: 'The type property identifies the type of STIX Object.', isCommon: true, isInteresting: false },
  { name: 'spec_version', type: 'string', required: true, description: 'The version of the STIX specification used to represent this object.', isCommon: true, isInteresting: false },
  { name: 'id', type: 'identifier', required: true, description: 'The id property universally and uniquely identifies this object.', isCommon: true, isInteresting: false },
  { name: 'object_marking_refs', type: 'list of identifier', required: false, description: 'The list of marking-definition objects to be applied to this object.', isCommon: true, isInteresting: false },
  { name: 'granular_markings', type: 'list of granular-marking', required: false, description: 'The set of granular markings that apply to this object.', isCommon: true, isInteresting: false },
  { name: 'defanged', type: 'boolean', required: false, description: 'Defines whether or not the data contained within the object has been defanged.', isCommon: true, isInteresting: false },
  { name: 'extensions', type: 'dictionary', required: false, description: 'Specifies any extensions of the object.', isCommon: true, isInteresting: false },
];

function emptyRels() { return { outgoing: [], incoming: [] }; }

// ---------------------------------------------------------------------------
// SDOs (19)
// ---------------------------------------------------------------------------

const attackPattern: StixObjectType = {
  type: 'attack-pattern',
  name: 'Attack Pattern',
  category: 'sdo',
  description: 'A type of TTP that describes ways that adversaries attempt to compromise targets. Attack Patterns are used to help categorize attacks, generalize specific attacks to the patterns that they follow, and provide detailed information about how attacks are performed.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Attack Pattern.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Attack Pattern.', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Attack Pattern.', isCommon: false, isInteresting: false },
    { name: 'kill_chain_phases', type: 'list of kill-chain-phase', required: false, description: 'The list of Kill Chain Phases for which this Attack Pattern is used.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_axjijf603msy`,
};

const campaign: StixObjectType = {
  type: 'campaign',
  name: 'Campaign',
  category: 'sdo',
  description: 'A grouping of adversarial behaviors that describes a set of malicious activities or attacks that occur over a period of time against a specific set of targets.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Campaign.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Campaign.', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Campaign.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The time that this Campaign was first seen.', isCommon: false, isInteresting: true },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The time that this Campaign was last seen.', isCommon: false, isInteresting: false },
    { name: 'objective', type: 'string', required: false, description: 'The Campaign\'s primary goal, objective, desired outcome, or intended effect.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_pcpvfz4ik6d6`,
};

const courseOfAction: StixObjectType = {
  type: 'course-of-action',
  name: 'Course of Action',
  category: 'sdo',
  description: 'A recommendation from a producer of intelligence to a consumer on the actions that they might take in response to a threat. It can be preventative to deter exploitation or corrective to counter its potential impact.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Course of Action.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Course of Action.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_a925mpw39txn`,
};

const grouping: StixObjectType = {
  type: 'grouping',
  name: 'Grouping',
  category: 'sdo',
  description: 'Explicitly asserts that the referenced STIX Objects have a shared context, unlike a Report which represents intelligence production. Groupings are used to characterize relatedness without asserting a formal report structure.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: false, description: 'A name used to identify the Grouping.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Grouping.', isCommon: false, isInteresting: false },
    { name: 'context', type: 'string', required: true, description: 'A short descriptor of the particular context shared by the content referenced by the Grouping.', isCommon: false, isInteresting: true },
    { name: 'object_refs', type: 'list of identifier', required: true, description: 'Specifies the STIX Objects that are referred to by this Grouping.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_t56pn7elv6u7`,
};

const identity: StixObjectType = {
  type: 'identity',
  name: 'Identity',
  category: 'sdo',
  description: 'Represents actual individuals, organizations, or groups, as well as classes of individuals, organizations, systems, or groups. Used to represent the creator of STIX content and targets of attacks.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'The name of this Identity.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Identity.', isCommon: false, isInteresting: false },
    { name: 'roles', type: 'list of string', required: false, description: 'The list of roles that this Identity performs.', isCommon: false, isInteresting: false },
    { name: 'identity_class', type: 'string', required: false, description: 'The type of entity that this Identity describes (e.g., individual, group, organization).', isCommon: false, isInteresting: true },
    { name: 'sectors', type: 'list of string', required: false, description: 'The list of industry sectors that this Identity belongs to.', isCommon: false, isInteresting: true },
    { name: 'contact_information', type: 'string', required: false, description: 'The contact information for this Identity.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_wh296fiwpklp`,
};

const incident: StixObjectType = {
  type: 'incident',
  name: 'Incident',
  category: 'sdo',
  description: 'A discrete instance of a security event that affects an organization. Incidents track the who, what, when, where, and how of a cyber security incident as it is investigated and resolved.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Incident.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Incident.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_sczfhw64pjxt`,
};

const indicator: StixObjectType = {
  type: 'indicator',
  name: 'Indicator',
  category: 'sdo',
  description: 'Contains a pattern that can be used to detect suspicious or malicious cyber activity. Indicators can express conditions like IP ranges, file hashes, or other observable patterns.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: false, description: 'A name used to identify the Indicator.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Indicator.', isCommon: false, isInteresting: false },
    { name: 'indicator_types', type: 'list of string', required: false, description: 'A set of categorizations for this indicator.', isCommon: false, isInteresting: true },
    { name: 'pattern', type: 'string', required: true, description: 'The detection pattern for this Indicator expressed as a STIX Patterning expression.', isCommon: false, isInteresting: true },
    { name: 'pattern_type', type: 'string', required: true, description: 'The pattern language used in this indicator (e.g., stix, snort, yara).', isCommon: false, isInteresting: true },
    { name: 'pattern_version', type: 'string', required: false, description: 'The version of the pattern language used for the pattern property.', isCommon: false, isInteresting: false },
    { name: 'valid_from', type: 'timestamp', required: true, description: 'The time from which this Indicator is considered a valid indicator of the behaviors it is related to.', isCommon: false, isInteresting: false },
    { name: 'valid_until', type: 'timestamp', required: false, description: 'The time at which this Indicator should no longer be considered a valid indicator.', isCommon: false, isInteresting: false },
    { name: 'kill_chain_phases', type: 'list of kill-chain-phase', required: false, description: 'The Kill Chain Phases for which this Indicator is used.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_muftrcpnf89v`,
};

const infrastructure: StixObjectType = {
  type: 'infrastructure',
  name: 'Infrastructure',
  category: 'sdo',
  description: 'Represents a type of TTP describing any systems, software services, and any associated physical or virtual resources intended to support some purpose. Infrastructure can include C2 servers, botnets, phishing sites, staging servers, etc.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name or characterizing text used to identify the Infrastructure.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Infrastructure.', isCommon: false, isInteresting: true },
    { name: 'infrastructure_types', type: 'list of string', required: false, description: 'The type of infrastructure being described.', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Infrastructure.', isCommon: false, isInteresting: false },
    { name: 'kill_chain_phases', type: 'list of kill-chain-phase', required: false, description: 'The list of Kill Chain Phases for which this Infrastructure is used.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The time that this Infrastructure was first seen performing malicious activities.', isCommon: false, isInteresting: false },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The time that this Infrastructure was last seen performing malicious activities.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_jo3k1o6lr9`,
};

const intrusionSet: StixObjectType = {
  type: 'intrusion-set',
  name: 'Intrusion Set',
  category: 'sdo',
  description: 'A grouped set of adversarial behaviors and resources with common properties that is believed to be orchestrated by a single organization. An Intrusion Set may capture multiple Campaigns or other activities.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify this Intrusion Set.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Intrusion Set.', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Intrusion Set.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The time that this Intrusion Set was first seen.', isCommon: false, isInteresting: false },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The time that this Intrusion Set was last seen.', isCommon: false, isInteresting: false },
    { name: 'goals', type: 'list of string', required: false, description: 'The high-level goals of this Intrusion Set.', isCommon: false, isInteresting: true },
    { name: 'resource_level', type: 'string', required: false, description: 'The organizational level at which this Intrusion Set typically works (e.g., government, club).', isCommon: false, isInteresting: false },
    { name: 'primary_motivation', type: 'string', required: false, description: 'The primary reason, motivation, or purpose behind this Intrusion Set.', isCommon: false, isInteresting: true },
    { name: 'secondary_motivations', type: 'list of string', required: false, description: 'The secondary reasons, motivations, or purposes behind this Intrusion Set.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_5ol9xlbbnrdn`,
};

const location: StixObjectType = {
  type: 'location',
  name: 'Location',
  category: 'sdo',
  description: 'Represents a geographic location. The location may be described by region, country, city, or precise coordinates. It is used to represent the origin or target of an attack, the location of a threat actor, etc.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: false, description: 'A name used to identify the Location.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A textual description of the Location.', isCommon: false, isInteresting: false },
    { name: 'latitude', type: 'float', required: false, description: 'The latitude of the Location in decimal degrees.', isCommon: false, isInteresting: true },
    { name: 'longitude', type: 'float', required: false, description: 'The longitude of the Location in decimal degrees.', isCommon: false, isInteresting: true },
    { name: 'precision', type: 'float', required: false, description: 'Defines the precision of the coordinates in meters.', isCommon: false, isInteresting: false },
    { name: 'region', type: 'string', required: false, description: 'The region that this Location describes.', isCommon: false, isInteresting: true },
    { name: 'country', type: 'string', required: false, description: 'The country that this Location describes (ISO 3166-1 Alpha-2 code).', isCommon: false, isInteresting: false },
    { name: 'administrative_area', type: 'string', required: false, description: 'The state, province, or other sub-national administrative area.', isCommon: false, isInteresting: false },
    { name: 'city', type: 'string', required: false, description: 'The city that this Location describes.', isCommon: false, isInteresting: false },
    { name: 'street_address', type: 'string', required: false, description: 'The street address that this Location describes.', isCommon: false, isInteresting: false },
    { name: 'postal_code', type: 'string', required: false, description: 'The postal code for this Location.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_th8nitr8jb4k`,
};

const malware: StixObjectType = {
  type: 'malware',
  name: 'Malware',
  category: 'sdo',
  description: 'A type of TTP representing malicious code. It generally refers to a program that is inserted into a system to damage, take control, or otherwise compromise the confidentiality, integrity, or availability of data, applications, or operating systems.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: false, description: 'A name used to identify the Malware instance or family.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Malware.', isCommon: false, isInteresting: true },
    { name: 'malware_types', type: 'list of string', required: false, description: 'A list of categorizations for the Malware (e.g., trojan, ransomware, backdoor).', isCommon: false, isInteresting: true },
    { name: 'is_family', type: 'boolean', required: true, description: 'Whether the object represents a malware family (true) or a malware instance (false).', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Malware.', isCommon: false, isInteresting: false },
    { name: 'kill_chain_phases', type: 'list of kill-chain-phase', required: false, description: 'The list of Kill Chain Phases for which this Malware can be used.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The time that the malware instance or family was first seen.', isCommon: false, isInteresting: false },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The time that the malware instance or family was last seen.', isCommon: false, isInteresting: false },
    { name: 'operating_system_refs', type: 'list of identifier', required: false, description: 'The operating systems that the malware family or instance targets.', isCommon: false, isInteresting: false },
    { name: 'architecture_execution_envs', type: 'list of string', required: false, description: 'The processor architectures that the malware instance or family is executable on.', isCommon: false, isInteresting: false },
    { name: 'implementation_languages', type: 'list of string', required: false, description: 'The programming languages used to implement the malware.', isCommon: false, isInteresting: false },
    { name: 'capabilities', type: 'list of string', required: false, description: 'Any known capabilities of the malware (e.g., persists-after-system-reboot).', isCommon: false, isInteresting: false },
    { name: 'sample_refs', type: 'list of identifier', required: false, description: 'The sample files associated with this malware.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_s5l7katgbp09`,
};

const malwareAnalysis: StixObjectType = {
  type: 'malware-analysis',
  name: 'Malware Analysis',
  category: 'sdo',
  description: 'Captures the metadata and results of a particular static or dynamic analysis performed on a malware instance or family. The analysis may be automated or manual.',
  properties: [
    ...sdoCommonProps,
    { name: 'product', type: 'string', required: true, description: 'The name of the analysis engine or product that was used.', isCommon: false, isInteresting: true },
    { name: 'version', type: 'string', required: false, description: 'The version of the analysis product that was used.', isCommon: false, isInteresting: false },
    { name: 'host_vm_ref', type: 'identifier', required: false, description: 'The virtual machine environment used to host the guest operating system.', isCommon: false, isInteresting: false },
    { name: 'operating_system_ref', type: 'identifier', required: false, description: 'The operating system used for the dynamic analysis.', isCommon: false, isInteresting: false },
    { name: 'installed_software_refs', type: 'list of identifier', required: false, description: 'Any non-OS software installed on the operating system used for dynamic analysis.', isCommon: false, isInteresting: false },
    { name: 'configuration_version', type: 'string', required: false, description: 'A named version of the configuration for the analysis engine.', isCommon: false, isInteresting: false },
    { name: 'modules', type: 'list of string', required: false, description: 'The specific analysis modules that were used.', isCommon: false, isInteresting: false },
    { name: 'analysis_engine_version', type: 'string', required: false, description: 'The version identifier associated with the analysis engine.', isCommon: false, isInteresting: false },
    { name: 'analysis_definition_version', type: 'string', required: false, description: 'The version of the definitions used by the analysis engine.', isCommon: false, isInteresting: false },
    { name: 'submitted', type: 'timestamp', required: false, description: 'The date and time that the malware was first submitted for scanning.', isCommon: false, isInteresting: false },
    { name: 'analysis_started', type: 'timestamp', required: false, description: 'The date and time that the malware analysis was initiated.', isCommon: false, isInteresting: false },
    { name: 'analysis_ended', type: 'timestamp', required: false, description: 'The date and time that the malware analysis ended.', isCommon: false, isInteresting: false },
    { name: 'result_name', type: 'string', required: false, description: 'The classification result as determined by the scanner or tool analysis process.', isCommon: false, isInteresting: true },
    { name: 'result', type: 'string', required: false, description: 'The classification result as determined by the scanner (e.g., malicious, benign).', isCommon: false, isInteresting: true },
    { name: 'analysis_sco_refs', type: 'list of identifier', required: false, description: 'References to the SCO objects that were captured during the analysis.', isCommon: false, isInteresting: true },
    { name: 'sample_ref', type: 'identifier', required: false, description: 'The sample that this analysis was performed against.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_6hdrixb3ua4j`,
};

const note: StixObjectType = {
  type: 'note',
  name: 'Note',
  category: 'sdo',
  description: 'Conveys informative text to provide further context and/or to provide additional analysis not contained in the STIX Objects that the Note refers to.',
  properties: [
    ...sdoCommonProps,
    { name: 'abstract', type: 'string', required: false, description: 'A brief summary of the note content.', isCommon: false, isInteresting: true },
    { name: 'content', type: 'string', required: true, description: 'The content of the note.', isCommon: false, isInteresting: true },
    { name: 'authors', type: 'list of string', required: false, description: 'The name of the author(s) of this note.', isCommon: false, isInteresting: true },
    { name: 'object_refs', type: 'list of identifier', required: true, description: 'The STIX Objects that the note is being applied to.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_gudodcg1sbb9`,
};

const observedData: StixObjectType = {
  type: 'observed-data',
  name: 'Observed Data',
  category: 'sdo',
  description: 'Conveys information about cyber security related entities such as files, systems, and networks that have been observed. Observed Data is not intelligence in and of itself but the raw information observed.',
  properties: [
    ...sdoCommonProps,
    { name: 'first_observed', type: 'timestamp', required: true, description: 'The beginning of the time window during which the data was observed.', isCommon: false, isInteresting: true },
    { name: 'last_observed', type: 'timestamp', required: true, description: 'The end of the time window during which the data was observed.', isCommon: false, isInteresting: true },
    { name: 'number_observed', type: 'integer', required: true, description: 'The number of times that each SCO referenced by object_refs was observed.', isCommon: false, isInteresting: true },
    { name: 'object_refs', type: 'list of identifier', required: true, description: 'A list of SCOs and SROs representing the observation.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_p49j1fwoxldc`,
};

const opinion: StixObjectType = {
  type: 'opinion',
  name: 'Opinion',
  category: 'sdo',
  description: 'An assessment of the correctness of the information in STIX Objects produced by a different entity. The primary property is the opinion value which captures the level of agreement or disagreement.',
  properties: [
    ...sdoCommonProps,
    { name: 'explanation', type: 'string', required: false, description: 'An explanation of why the producer has this Opinion.', isCommon: false, isInteresting: true },
    { name: 'authors', type: 'list of string', required: false, description: 'The name of the author(s) of this Opinion.', isCommon: false, isInteresting: false },
    { name: 'opinion', type: 'enum', required: true, description: 'The opinion value (strongly-disagree, disagree, neutral, agree, strongly-agree).', isCommon: false, isInteresting: true },
    { name: 'object_refs', type: 'list of identifier', required: true, description: 'The STIX Objects that this Opinion is being applied to.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_ht1vtzfbtzda`,
};

const report: StixObjectType = {
  type: 'report',
  name: 'Report',
  category: 'sdo',
  description: 'Collections of threat intelligence focused on one or more topics, such as a description of a threat actor, malware, or attack technique, including context and related details.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Report.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Report.', isCommon: false, isInteresting: true },
    { name: 'report_types', type: 'list of string', required: false, description: 'The primary types of content found in this report (e.g., threat-report, campaign).', isCommon: false, isInteresting: true },
    { name: 'published', type: 'timestamp', required: true, description: 'The date that this Report was officially published.', isCommon: false, isInteresting: true },
    { name: 'object_refs', type: 'list of identifier', required: true, description: 'Specifies the STIX Objects that are referred to by this Report.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_n8bjzg1ysgdq`,
};

const threatActor: StixObjectType = {
  type: 'threat-actor',
  name: 'Threat Actor',
  category: 'sdo',
  description: 'Represents actual individuals, groups, or organizations believed to be operating with malicious intent. Threat Actors can be characterized by their motives, capabilities, and goals.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify this Threat Actor or Threat Actor group.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Threat Actor.', isCommon: false, isInteresting: true },
    { name: 'threat_actor_types', type: 'list of string', required: false, description: 'The type(s) of this threat actor (e.g., nation-state, criminal, hacktivist).', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'A list of other names that this Threat Actor is believed to use.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The time that this Threat Actor was first seen.', isCommon: false, isInteresting: false },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The time that this Threat Actor was last seen.', isCommon: false, isInteresting: false },
    { name: 'roles', type: 'list of string', required: false, description: 'A list of roles the Threat Actor plays (e.g., agent, director, sponsor).', isCommon: false, isInteresting: false },
    { name: 'goals', type: 'list of string', required: false, description: 'The high-level goals of this Threat Actor.', isCommon: false, isInteresting: false },
    { name: 'sophistication', type: 'string', required: false, description: 'The skill, knowledge, and resources of this Threat Actor (e.g., none, minimal, expert).', isCommon: false, isInteresting: true },
    { name: 'resource_level', type: 'string', required: false, description: 'The organizational level at which this Threat Actor typically works.', isCommon: false, isInteresting: false },
    { name: 'primary_motivation', type: 'string', required: false, description: 'The primary reason, motivation, or purpose behind this Threat Actor.', isCommon: false, isInteresting: false },
    { name: 'secondary_motivations', type: 'list of string', required: false, description: 'The secondary reasons, motivations, or purposes behind this Threat Actor.', isCommon: false, isInteresting: false },
    { name: 'personal_motivations', type: 'list of string', required: false, description: 'The personal reasons, motivations, or purposes of the Threat Actor.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_k017w16zutw`,
};

const tool: StixObjectType = {
  type: 'tool',
  name: 'Tool',
  category: 'sdo',
  description: 'Legitimate software that can be used by threat actors to perform attacks. Unlike malware, tools are not inherently malicious but may be used for malicious purposes (e.g., PsExec, Mimikatz, nmap).',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'The name used to identify the Tool.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Tool.', isCommon: false, isInteresting: true },
    { name: 'tool_types', type: 'list of string', required: false, description: 'The kind(s) of tool(s) being described (e.g., remote-access, exploitation, credential-exploitation).', isCommon: false, isInteresting: true },
    { name: 'aliases', type: 'list of string', required: false, description: 'Alternative names used to identify this Tool.', isCommon: false, isInteresting: false },
    { name: 'kill_chain_phases', type: 'list of kill-chain-phase', required: false, description: 'The list of Kill Chain Phases for which this Tool can be used.', isCommon: false, isInteresting: false },
    { name: 'tool_version', type: 'string', required: false, description: 'The version identifier associated with the Tool.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_z9v2v3kktega`,
};

const vulnerability: StixObjectType = {
  type: 'vulnerability',
  name: 'Vulnerability',
  category: 'sdo',
  description: 'A mistake in software that can be directly used by a hacker to gain access to a system or network. Typically tracked using CVE identifiers from the MITRE Corporation.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Vulnerability.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Vulnerability.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_q5ytzmajn6re`,
};

// ---------------------------------------------------------------------------
// SROs (2)
// ---------------------------------------------------------------------------

const relationship: StixObjectType = {
  type: 'relationship',
  name: 'Relationship',
  category: 'sro',
  description: 'Used to link together two SDOs or SCOs in order to describe how they are related to each other. Relationship types include uses, targets, attributed-to, indicates, and more.',
  properties: [
    ...sroCommonProps,
    { name: 'relationship_type', type: 'string', required: true, description: 'The name used to identify the type of Relationship (e.g., uses, targets).', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Relationship.', isCommon: false, isInteresting: false },
    { name: 'source_ref', type: 'identifier', required: true, description: 'The id of the source (from) object.', isCommon: false, isInteresting: true },
    { name: 'target_ref', type: 'identifier', required: true, description: 'The id of the target (to) object.', isCommon: false, isInteresting: true },
    { name: 'start_time', type: 'timestamp', required: false, description: 'Represents the earliest time at which the Relationship between the objects exists.', isCommon: false, isInteresting: false },
    { name: 'stop_time', type: 'timestamp', required: false, description: 'Represents the latest time at which the Relationship between the objects exists.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_e2e1szrqfoan`,
};

const sighting: StixObjectType = {
  type: 'sighting',
  name: 'Sighting',
  category: 'sro',
  description: 'Denotes the belief that something in CTI (e.g., an indicator, malware, tool) was seen. Sightings are used to track who saw what and when, providing evidence for threat intelligence.',
  properties: [
    ...sroCommonProps,
    { name: 'description', type: 'string', required: false, description: 'A description that provides more details and context about the Sighting.', isCommon: false, isInteresting: false },
    { name: 'first_seen', type: 'timestamp', required: false, description: 'The beginning of the time window during which the SDO referenced by sighting_of_ref was sighted.', isCommon: false, isInteresting: true },
    { name: 'last_seen', type: 'timestamp', required: false, description: 'The end of the time window during which the SDO referenced by sighting_of_ref was sighted.', isCommon: false, isInteresting: false },
    { name: 'count', type: 'integer', required: false, description: 'The number of times that the SDO referenced by sighting_of_ref was sighted.', isCommon: false, isInteresting: true },
    { name: 'sighting_of_ref', type: 'identifier', required: true, description: 'An ID reference to the SDO that was sighted.', isCommon: false, isInteresting: true },
    { name: 'observed_data_refs', type: 'list of identifier', required: false, description: 'A list of Observed Data objects that are related to this Sighting.', isCommon: false, isInteresting: false },
    { name: 'where_sighted_refs', type: 'list of identifier', required: false, description: 'A list of Identity objects representing the entities that saw the sighting.', isCommon: false, isInteresting: true },
    { name: 'summary', type: 'boolean', required: false, description: 'Indicates whether the Sighting represents a summary of multiple sightings.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_a795guqsap3r`,
};

// ---------------------------------------------------------------------------
// SCOs (18)
// ---------------------------------------------------------------------------

const artifact: StixObjectType = {
  type: 'artifact',
  name: 'Artifact',
  category: 'sco',
  description: 'Permits capturing an array of bytes as a raw artifact or a file-like payload. It can represent binary content with a MIME type, or provide a URL to retrieve the content.',
  properties: [
    ...scoCommonProps,
    { name: 'mime_type', type: 'string', required: false, description: 'The value of the MIME type of the artifact (e.g., application/pdf).', isCommon: false, isInteresting: true },
    { name: 'payload_bin', type: 'binary', required: false, description: 'The binary data contained in the artifact as a base64-encoded string.', isCommon: false, isInteresting: true },
    { name: 'url', type: 'string', required: false, description: 'A valid URL that resolves to the unencoded content.', isCommon: false, isInteresting: true },
    { name: 'hashes', type: 'hashes', required: false, description: 'Specifies a dictionary of hashes for the contents of the url or the payload_bin.', isCommon: false, isInteresting: true },
    { name: 'encryption_algorithm', type: 'enum', required: false, description: 'The type of encryption algorithm the binary data is encrypted with (e.g., AES-256-GCM).', isCommon: false, isInteresting: false },
    { name: 'decryption_key', type: 'string', required: false, description: 'The decryption key for the encrypted binary data.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_4jegwl6ojbes`,
};

const autonomousSystem: StixObjectType = {
  type: 'autonomous-system',
  name: 'Autonomous System',
  category: 'sco',
  description: 'Represents the properties of an Autonomous System (AS) on the Internet, identified by its AS number.',
  properties: [
    ...scoCommonProps,
    { name: 'number', type: 'integer', required: true, description: 'The number assigned to the AS (e.g., 15169 for Google).', isCommon: false, isInteresting: true },
    { name: 'name', type: 'string', required: false, description: 'The name of the AS.', isCommon: false, isInteresting: true },
    { name: 'rir', type: 'string', required: false, description: 'The name of the Regional Internet Registry (RIR) that assigned the number to the AS.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_27gux0aol9e3`,
};

const directory: StixObjectType = {
  type: 'directory',
  name: 'Directory',
  category: 'sco',
  description: 'Represents the properties common to a file system directory on various operating systems.',
  properties: [
    ...scoCommonProps,
    { name: 'path', type: 'string', required: true, description: 'The path, as originally observed, to the directory on the file system.', isCommon: false, isInteresting: true },
    { name: 'path_enc', type: 'string', required: false, description: 'The observed encoding for the path (e.g., UTF-8).', isCommon: false, isInteresting: false },
    { name: 'ctime', type: 'timestamp', required: false, description: 'The date and time the directory was created.', isCommon: false, isInteresting: true },
    { name: 'mtime', type: 'timestamp', required: false, description: 'The date and time the directory was last written to/modified.', isCommon: false, isInteresting: true },
    { name: 'atime', type: 'timestamp', required: false, description: 'The date and time the directory was last accessed.', isCommon: false, isInteresting: false },
    { name: 'contains_refs', type: 'list of identifier', required: false, description: 'A list of references to other File and/or Directory objects contained within the directory.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_lyvpga5hlw52`,
};

const domainName: StixObjectType = {
  type: 'domain-name',
  name: 'Domain Name',
  category: 'sco',
  description: 'Represents the properties of a network domain name, including subdomains.',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The value of the domain name (e.g., example.com).', isCommon: false, isInteresting: true },
    { name: 'resolves_to_refs', type: 'list of identifier', required: false, description: 'A list of references to IP addresses or domain names that this domain resolves to.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_prhhksbxbg87`,
};

const emailAddr: StixObjectType = {
  type: 'email-addr',
  name: 'Email Address',
  category: 'sco',
  description: 'Represents a single email address, including the display name if applicable.',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The value of the email address (e.g., john@example.com).', isCommon: false, isInteresting: true },
    { name: 'display_name', type: 'string', required: false, description: 'A single email display name, i.e., the name that is displayed to the user of a mail application.', isCommon: false, isInteresting: true },
    { name: 'belongs_to_ref', type: 'identifier', required: false, description: 'Specifies a reference to the user-account object that this email address belongs to.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_wmenahkvqmgj`,
};

const emailMessage: StixObjectType = {
  type: 'email-message',
  name: 'Email Message',
  category: 'sco',
  description: 'Represents an instance of an email message, including the headers and body. Email messages can include references to attachments and other email addresses.',
  properties: [
    ...scoCommonProps,
    { name: 'is_multipart', type: 'boolean', required: true, description: 'Indicates whether the email body contains multiple MIME parts.', isCommon: false, isInteresting: true },
    { name: 'date', type: 'timestamp', required: false, description: 'The date and time that the email message was sent.', isCommon: false, isInteresting: true },
    { name: 'content_type', type: 'string', required: false, description: 'The value of the content_type header of the email.', isCommon: false, isInteresting: false },
    { name: 'from_ref', type: 'identifier', required: false, description: 'The from field of the email message.', isCommon: false, isInteresting: true },
    { name: 'sender_ref', type: 'identifier', required: false, description: 'The sender field of the email message.', isCommon: false, isInteresting: false },
    { name: 'to_refs', type: 'list of identifier', required: false, description: 'The to field of the email message.', isCommon: false, isInteresting: true },
    { name: 'cc_refs', type: 'list of identifier', required: false, description: 'The CC field of the email message.', isCommon: false, isInteresting: false },
    { name: 'bcc_refs', type: 'list of identifier', required: false, description: 'The BCC field of the email message.', isCommon: false, isInteresting: false },
    { name: 'message_id', type: 'string', required: false, description: 'The Message-ID field of the email message.', isCommon: false, isInteresting: false },
    { name: 'subject', type: 'string', required: false, description: 'The subject of the email message.', isCommon: false, isInteresting: false },
    { name: 'received_lines', type: 'list of string', required: false, description: 'One or more Received header fields that may be present in the email headers.', isCommon: false, isInteresting: false },
    { name: 'additional_header_fields', type: 'dictionary', required: false, description: 'Any other header fields found in the email message.', isCommon: false, isInteresting: false },
    { name: 'body', type: 'string', required: false, description: 'The body of the email message.', isCommon: false, isInteresting: false },
    { name: 'body_multipart', type: 'list of email-mime-part-type', required: false, description: 'The MIME parts that make up the email body for multipart messages.', isCommon: false, isInteresting: false },
    { name: 'raw_email_ref', type: 'identifier', required: false, description: 'A reference to an Artifact object containing the raw email message.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_grboc7sq5514`,
};

const file: StixObjectType = {
  type: 'file',
  name: 'File',
  category: 'sco',
  description: 'Represents the properties of a file. A File must have at least one of name or hashes defined.',
  properties: [
    ...scoCommonProps,
    { name: 'hashes', type: 'hashes', required: false, description: 'Specifies a dictionary of hashes for the file (e.g., MD5, SHA-256).', isCommon: false, isInteresting: true },
    { name: 'size', type: 'integer', required: false, description: 'The size of the file, in bytes.', isCommon: false, isInteresting: true },
    { name: 'name', type: 'string', required: false, description: 'The name of the file.', isCommon: false, isInteresting: true },
    { name: 'name_enc', type: 'string', required: false, description: 'The observed encoding for the name of the file.', isCommon: false, isInteresting: false },
    { name: 'magic_number_hex', type: 'hex', required: false, description: 'The hexadecimal constant (magic number) associated with a specific file format.', isCommon: false, isInteresting: false },
    { name: 'mime_type', type: 'string', required: false, description: 'The MIME type name specified for the file.', isCommon: false, isInteresting: true },
    { name: 'ctime', type: 'timestamp', required: false, description: 'The date and time the file was created.', isCommon: false, isInteresting: false },
    { name: 'mtime', type: 'timestamp', required: false, description: 'The date and time the file was last written to/modified.', isCommon: false, isInteresting: false },
    { name: 'atime', type: 'timestamp', required: false, description: 'The date and time the file was last accessed.', isCommon: false, isInteresting: false },
    { name: 'parent_directory_ref', type: 'identifier', required: false, description: 'The parent directory of the file.', isCommon: false, isInteresting: false },
    { name: 'contains_refs', type: 'list of identifier', required: false, description: 'References to other SCOs contained within the file (e.g., for archives).', isCommon: false, isInteresting: false },
    { name: 'content_ref', type: 'identifier', required: false, description: 'The content of the file as an Artifact object.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_99bl2dibcztv`,
};

const ipv4Addr: StixObjectType = {
  type: 'ipv4-addr',
  name: 'IPv4 Address',
  category: 'sco',
  description: 'Represents one or more IPv4 addresses expressed using CIDR notation.',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The values of one or more IPv4 addresses expressed using CIDR notation.', isCommon: false, isInteresting: true },
    { name: 'resolves_to_refs', type: 'list of identifier', required: false, description: 'References to one or more Layer 2 MAC addresses that the IPv4 address resolves to.', isCommon: false, isInteresting: true },
    { name: 'belongs_to_refs', type: 'list of identifier', required: false, description: 'References to one or more Autonomous Systems that the IPv4 address belongs to.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_ki1ufj1ku8s0`,
};

const ipv6Addr: StixObjectType = {
  type: 'ipv6-addr',
  name: 'IPv6 Address',
  category: 'sco',
  description: 'Represents one or more IPv6 addresses expressed using CIDR notation.',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The values of one or more IPv6 addresses expressed using CIDR notation.', isCommon: false, isInteresting: true },
    { name: 'resolves_to_refs', type: 'list of identifier', required: false, description: 'References to one or more Layer 2 MAC addresses that the IPv6 address resolves to.', isCommon: false, isInteresting: true },
    { name: 'belongs_to_refs', type: 'list of identifier', required: false, description: 'References to one or more Autonomous Systems that the IPv6 address belongs to.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_oeggeryskriq`,
};

const macAddr: StixObjectType = {
  type: 'mac-addr',
  name: 'MAC Address',
  category: 'sco',
  description: 'Represents a single Media Access Control (MAC) address.',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The value of a single MAC address (e.g., d2:fb:49:24:37:18).', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_f92nr9plf58y`,
};

const mutex: StixObjectType = {
  type: 'mutex',
  name: 'Mutex',
  category: 'sco',
  description: 'Represents the properties of a mutual exclusion (mutex) object. Mutexes are often used by malware as a way to avoid re-infecting the same machine.',
  properties: [
    ...scoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'The name of the mutex object.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_84hwlkdmev1w`,
};

const networkTraffic: StixObjectType = {
  type: 'network-traffic',
  name: 'Network Traffic',
  category: 'sco',
  description: 'Represents arbitrary network traffic that originates from a source and is addressed to a destination. It includes properties for common network protocols and traffic metadata.',
  properties: [
    ...scoCommonProps,
    { name: 'start', type: 'timestamp', required: false, description: 'The date and time the network traffic was initiated.', isCommon: false, isInteresting: true },
    { name: 'end', type: 'timestamp', required: false, description: 'The date and time the network traffic ended.', isCommon: false, isInteresting: false },
    { name: 'is_active', type: 'boolean', required: false, description: 'Indicates whether the network traffic is still ongoing.', isCommon: false, isInteresting: false },
    { name: 'src_ref', type: 'identifier', required: false, description: 'The source of the network traffic as a reference to an SCO.', isCommon: false, isInteresting: true },
    { name: 'dst_ref', type: 'identifier', required: false, description: 'The destination of the network traffic as a reference to an SCO.', isCommon: false, isInteresting: true },
    { name: 'src_port', type: 'integer', required: false, description: 'The source port used in the network traffic.', isCommon: false, isInteresting: false },
    { name: 'dst_port', type: 'integer', required: false, description: 'The destination port used in the network traffic.', isCommon: false, isInteresting: false },
    { name: 'protocols', type: 'list of string', required: true, description: 'The protocols observed in the network traffic, listed in order from outermost to innermost.', isCommon: false, isInteresting: true },
    { name: 'src_byte_count', type: 'integer', required: false, description: 'The number of bytes sent from the source to the destination.', isCommon: false, isInteresting: false },
    { name: 'dst_byte_count', type: 'integer', required: false, description: 'The number of bytes sent from the destination to the source.', isCommon: false, isInteresting: false },
    { name: 'src_packets', type: 'integer', required: false, description: 'The number of packets sent from the source to the destination.', isCommon: false, isInteresting: false },
    { name: 'dst_packets', type: 'integer', required: false, description: 'The number of packets sent from the destination to the source.', isCommon: false, isInteresting: false },
    { name: 'ipfix', type: 'dictionary', required: false, description: 'Any IPFIX data for the traffic, as a dictionary.', isCommon: false, isInteresting: false },
    { name: 'src_payload_ref', type: 'identifier', required: false, description: 'The bytes sent from the source to the destination, as an Artifact object.', isCommon: false, isInteresting: false },
    { name: 'dst_payload_ref', type: 'identifier', required: false, description: 'The bytes sent from the destination to the source, as an Artifact object.', isCommon: false, isInteresting: false },
    { name: 'encapsulates_refs', type: 'list of identifier', required: false, description: 'References to other network-traffic objects encapsulated by this network traffic.', isCommon: false, isInteresting: false },
    { name: 'encapsulated_by_ref', type: 'identifier', required: false, description: 'Reference to another network-traffic object that encapsulates this object.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_rgnc3w40xy`,
};

const process: StixObjectType = {
  type: 'process',
  name: 'Process',
  category: 'sco',
  description: 'Represents common properties of an instance of a computer program as executed on an operating system.',
  properties: [
    ...scoCommonProps,
    { name: 'is_hidden', type: 'boolean', required: false, description: 'Whether the process is hidden.', isCommon: false, isInteresting: true },
    { name: 'pid', type: 'integer', required: false, description: 'The Process ID of the process.', isCommon: false, isInteresting: true },
    { name: 'created_time', type: 'timestamp', required: false, description: 'The date and time at which the process was created.', isCommon: false, isInteresting: true },
    { name: 'cwd', type: 'string', required: false, description: 'The current working directory of the process.', isCommon: false, isInteresting: false },
    { name: 'command_line', type: 'string', required: false, description: 'The full command line used in executing the process.', isCommon: false, isInteresting: true },
    { name: 'environment_variables', type: 'dictionary', required: false, description: 'The list of environment variables associated with the process.', isCommon: false, isInteresting: false },
    { name: 'opened_connections_refs', type: 'list of identifier', required: false, description: 'References to network connections opened by the process.', isCommon: false, isInteresting: false },
    { name: 'creator_user_ref', type: 'identifier', required: false, description: 'The user that created the process.', isCommon: false, isInteresting: false },
    { name: 'image_ref', type: 'identifier', required: false, description: 'The executable binary that was executed as the process image.', isCommon: false, isInteresting: false },
    { name: 'parent_ref', type: 'identifier', required: false, description: 'The other process that spawned this one.', isCommon: false, isInteresting: false },
    { name: 'child_refs', type: 'list of identifier', required: false, description: 'The other processes that were spawned by this process.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_hclzia4tf8fz`,
};

const software: StixObjectType = {
  type: 'software',
  name: 'Software',
  category: 'sco',
  description: 'Represents high-level properties associated with software, including software products.',
  properties: [
    ...scoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'The name of the software.', isCommon: false, isInteresting: true },
    { name: 'cpe', type: 'string', required: false, description: 'The Common Platform Enumeration (CPE) entry for the software.', isCommon: false, isInteresting: true },
    { name: 'swid', type: 'string', required: false, description: 'The Software Identification (SWID) Tags entry for the software.', isCommon: false, isInteresting: false },
    { name: 'languages', type: 'list of string', required: false, description: 'The languages supported by the software.', isCommon: false, isInteresting: false },
    { name: 'vendor', type: 'string', required: false, description: 'The name of the vendor of the software.', isCommon: false, isInteresting: true },
    { name: 'version', type: 'string', required: false, description: 'The version of the software.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_7rkyhtkdthok`,
};

const url: StixObjectType = {
  type: 'url',
  name: 'URL',
  category: 'sco',
  description: 'Represents the properties of a uniform resource locator (URL).',
  properties: [
    ...scoCommonProps,
    { name: 'value', type: 'string', required: true, description: 'The value of the URL.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_ah3hict2dez0`,
};

const userAccount: StixObjectType = {
  type: 'user-account',
  name: 'User Account',
  category: 'sco',
  description: 'Represents an instance of any type of user account, including operating system, device, messaging service, and social media platform accounts.',
  properties: [
    ...scoCommonProps,
    { name: 'user_id', type: 'string', required: false, description: 'The identifier of the account (e.g., the numeric uid on a Unix system).', isCommon: false, isInteresting: true },
    { name: 'credential', type: 'string', required: false, description: 'A cleartext credential, not PII-safe.', isCommon: false, isInteresting: false },
    { name: 'account_login', type: 'string', required: false, description: 'The account login string used to log into the account.', isCommon: false, isInteresting: true },
    { name: 'account_type', type: 'string', required: false, description: 'The type of the account (e.g., unix, windows-local, ldap).', isCommon: false, isInteresting: true },
    { name: 'display_name', type: 'string', required: false, description: 'The display name of the account.', isCommon: false, isInteresting: true },
    { name: 'is_service_account', type: 'boolean', required: false, description: 'Indicates that the account is associated with a network service or system process.', isCommon: false, isInteresting: false },
    { name: 'is_privileged', type: 'boolean', required: false, description: 'Whether the account has elevated privileges.', isCommon: false, isInteresting: false },
    { name: 'can_escalate_privs', type: 'boolean', required: false, description: 'Whether the account has the ability to escalate privileges.', isCommon: false, isInteresting: false },
    { name: 'is_disabled', type: 'boolean', required: false, description: 'Whether the account is disabled.', isCommon: false, isInteresting: false },
    { name: 'account_created', type: 'timestamp', required: false, description: 'When the account was created.', isCommon: false, isInteresting: false },
    { name: 'account_expires', type: 'timestamp', required: false, description: 'The expiration date of the account.', isCommon: false, isInteresting: false },
    { name: 'credential_last_changed', type: 'timestamp', required: false, description: 'When the account credential was last changed.', isCommon: false, isInteresting: false },
    { name: 'account_first_login', type: 'timestamp', required: false, description: 'When the account was first accessed.', isCommon: false, isInteresting: false },
    { name: 'account_last_login', type: 'timestamp', required: false, description: 'When the account was last accessed.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_azo70vgj1vm2`,
};

const windowsRegistryKey: StixObjectType = {
  type: 'windows-registry-key',
  name: 'Windows Registry Key',
  category: 'sco',
  description: 'Represents the properties of a Windows registry key. The key and its values are the primary observable data captured.',
  properties: [
    ...scoCommonProps,
    { name: 'key', type: 'string', required: false, description: 'The full registry key path including the hive (e.g., HKEY_LOCAL_MACHINE\\System).', isCommon: false, isInteresting: true },
    { name: 'values', type: 'list of windows-registry-value-type', required: false, description: 'The values found under the registry key.', isCommon: false, isInteresting: true },
    { name: 'modified_time', type: 'timestamp', required: false, description: 'The last date and time that the registry key was modified.', isCommon: false, isInteresting: true },
    { name: 'creator_user_ref', type: 'identifier', required: false, description: 'A reference to the user account that created the registry key.', isCommon: false, isInteresting: false },
    { name: 'number_of_subkeys', type: 'integer', required: false, description: 'The number of subkeys contained under the registry key.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_luvw8wjlfo3y`,
};

const x509Certificate: StixObjectType = {
  type: 'x509-certificate',
  name: 'X.509 Certificate',
  category: 'sco',
  description: 'Represents the properties of an X.509 certificate, as defined by ITU recommendation X.509. These are commonly used for TLS/SSL authentication.',
  properties: [
    ...scoCommonProps,
    { name: 'is_self_signed', type: 'boolean', required: false, description: 'Whether the certificate is self-signed.', isCommon: false, isInteresting: true },
    { name: 'hashes', type: 'hashes', required: false, description: 'Any hashes that were calculated for the entire contents of the certificate.', isCommon: false, isInteresting: false },
    { name: 'version', type: 'string', required: false, description: 'The version of the encoded certificate.', isCommon: false, isInteresting: false },
    { name: 'serial_number', type: 'string', required: false, description: 'The unique identifier for the certificate as issued by a specific Certificate Authority.', isCommon: false, isInteresting: true },
    { name: 'signature_algorithm', type: 'string', required: false, description: 'The name of the algorithm used to sign the certificate.', isCommon: false, isInteresting: false },
    { name: 'issuer', type: 'string', required: false, description: 'The name of the Certificate Authority that issued the certificate.', isCommon: false, isInteresting: true },
    { name: 'validity_not_before', type: 'timestamp', required: false, description: 'The date on which the validity period begins.', isCommon: false, isInteresting: false },
    { name: 'validity_not_after', type: 'timestamp', required: false, description: 'The date on which the validity period ends.', isCommon: false, isInteresting: false },
    { name: 'subject', type: 'string', required: false, description: 'The name of the entity associated with the public key stored in the subject public key field.', isCommon: false, isInteresting: true },
    { name: 'subject_public_key_algorithm', type: 'string', required: false, description: 'The algorithm identifier for the public key.', isCommon: false, isInteresting: false },
    { name: 'subject_public_key_modulus', type: 'string', required: false, description: 'The modulus portion of the subject\'s public key.', isCommon: false, isInteresting: false },
    { name: 'subject_public_key_exponent', type: 'integer', required: false, description: 'The exponent portion of the subject\'s public key.', isCommon: false, isInteresting: false },
    { name: 'x509_v3_extensions', type: 'x509-v3-extensions-type', required: false, description: 'Any standard X.509 v3 extensions that may be used in the certificate.', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_8abcy1o5x9w1`,
};

// ---------------------------------------------------------------------------
// Meta Objects (4)
// ---------------------------------------------------------------------------

const bundle: StixObjectType = {
  type: 'bundle',
  name: 'Bundle',
  category: 'meta',
  description: 'A collection of arbitrary STIX Objects grouped together in a single container. A Bundle does not assert any semantic relationship between the objects it contains.',
  properties: [
    { name: 'type', type: 'string', required: true, description: 'The type property must be "bundle".', isCommon: false, isInteresting: true },
    { name: 'id', type: 'identifier', required: true, description: 'An identifier for this Bundle.', isCommon: false, isInteresting: true },
    { name: 'objects', type: 'list of object', required: false, description: 'A list of STIX Objects contained within this Bundle.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_gms872kuzdmg`,
};

const extensionDefinition: StixObjectType = {
  type: 'extension-definition',
  name: 'Extension Definition',
  category: 'meta',
  description: 'Allows producers to extend existing STIX Objects, define entirely new STIX Objects, and share these with other trusted partners through a formal definition mechanism.',
  properties: [
    ...sdoCommonProps,
    { name: 'name', type: 'string', required: true, description: 'A name used to identify the Extension Definition.', isCommon: false, isInteresting: true },
    { name: 'description', type: 'string', required: false, description: 'A description of the purpose of the extension.', isCommon: false, isInteresting: true },
    { name: 'schema', type: 'string', required: true, description: 'The normative definition of the extension, either as a URL or as text in the extension_properties property.', isCommon: false, isInteresting: true },
    { name: 'version', type: 'string', required: true, description: 'The version of this extension.', isCommon: false, isInteresting: false },
    { name: 'extension_types', type: 'list of string', required: true, description: 'The type(s) of extension that this definition describes (e.g., new-sdo, property-extension).', isCommon: false, isInteresting: true },
    { name: 'extension_properties', type: 'list of string', required: false, description: 'If present, defines additional properties for an extension of type "property-extension".', isCommon: false, isInteresting: false },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_32j232tfvtly`,
};

const languageContent: StixObjectType = {
  type: 'language-content',
  name: 'Language Content',
  category: 'meta',
  description: 'Represents text content for STIX Objects represented in languages other than that of the original object. Language content allows objects to be translated without modifying the original.',
  properties: [
    ...sdoCommonProps,
    { name: 'object_ref', type: 'identifier', required: true, description: 'Identifies the object that this Language Content applies to.', isCommon: false, isInteresting: true },
    { name: 'object_modified', type: 'timestamp', required: false, description: 'Identifies the modified time of the object that this Language Content applies to.', isCommon: false, isInteresting: false },
    { name: 'contents', type: 'dictionary', required: true, description: 'The translated content organized by language code and property name.', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_z9r1cwtu8jja`,
};

const markingDefinition: StixObjectType = {
  type: 'marking-definition',
  name: 'Marking Definition',
  category: 'meta',
  description: 'Represents a specific marking. Data markings represent restrictions, permissions, and other guidance for how data can be used and shared. The most common is TLP (Traffic Light Protocol).',
  properties: [
    { name: 'type', type: 'string', required: true, description: 'The type property must be "marking-definition".', isCommon: false, isInteresting: false },
    { name: 'spec_version', type: 'string', required: true, description: 'The version of the STIX specification used to represent this object.', isCommon: false, isInteresting: false },
    { name: 'id', type: 'identifier', required: true, description: 'The id property universally and uniquely identifies this object.', isCommon: false, isInteresting: false },
    { name: 'created_by_ref', type: 'identifier', required: false, description: 'The ID of the identity that created this object.', isCommon: false, isInteresting: false },
    { name: 'created', type: 'timestamp', required: true, description: 'The time at which the object was originally created.', isCommon: false, isInteresting: false },
    { name: 'external_references', type: 'list of external-reference', required: false, description: 'A list of external references.', isCommon: false, isInteresting: false },
    { name: 'object_marking_refs', type: 'list of identifier', required: false, description: 'The list of marking-definition objects to be applied.', isCommon: false, isInteresting: false },
    { name: 'granular_markings', type: 'list of granular-marking', required: false, description: 'The set of granular markings that apply to this object.', isCommon: false, isInteresting: false },
    { name: 'extensions', type: 'dictionary', required: false, description: 'Specifies any extensions of the object.', isCommon: false, isInteresting: false },
    { name: 'name', type: 'string', required: false, description: 'A name used to identify this Marking Definition.', isCommon: false, isInteresting: true },
    { name: 'definition_type', type: 'string', required: false, description: 'The definition_type property identifies the type of Marking Definition (e.g., statement, tlp).', isCommon: false, isInteresting: true },
    { name: 'definition', type: 'object', required: false, description: 'The definition property contains the marking object itself (e.g., a Statement or TLP marking).', isCommon: false, isInteresting: true },
  ],
  relationships: emptyRels(),
  example: {},
  specUrl: `${SPEC_BASE}#_k5fndj2c7c1k`,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const stixObjects: StixObjectType[] = [
  // SDOs (19)
  attackPattern,
  campaign,
  courseOfAction,
  grouping,
  identity,
  incident,
  indicator,
  infrastructure,
  intrusionSet,
  location,
  malware,
  malwareAnalysis,
  note,
  observedData,
  opinion,
  report,
  threatActor,
  tool,
  vulnerability,
  // SROs (2)
  relationship,
  sighting,
  // SCOs (18)
  artifact,
  autonomousSystem,
  directory,
  domainName,
  emailAddr,
  emailMessage,
  file,
  ipv4Addr,
  ipv6Addr,
  macAddr,
  mutex,
  networkTraffic,
  process,
  software,
  url,
  userAccount,
  windowsRegistryKey,
  x509Certificate,
  // Meta (4)
  bundle,
  extensionDefinition,
  languageContent,
  markingDefinition,
];
