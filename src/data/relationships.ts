export interface RelationshipMapping {
  sourceType: string;
  relationshipType: string;
  targetTypes: string[];
}

export const relationships: RelationshipMapping[] = [
  // attack-pattern
  { sourceType: 'attack-pattern', relationshipType: 'delivers', targetTypes: ['malware'] },
  { sourceType: 'attack-pattern', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'attack-pattern', relationshipType: 'uses', targetTypes: ['malware', 'tool'] },

  // campaign
  { sourceType: 'campaign', relationshipType: 'attributed-to', targetTypes: ['intrusion-set', 'threat-actor'] },
  { sourceType: 'campaign', relationshipType: 'compromises', targetTypes: ['infrastructure'] },
  { sourceType: 'campaign', relationshipType: 'originates-from', targetTypes: ['location'] },
  { sourceType: 'campaign', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'campaign', relationshipType: 'uses', targetTypes: ['attack-pattern', 'infrastructure', 'malware', 'tool'] },

  // course-of-action
  { sourceType: 'course-of-action', relationshipType: 'investigates', targetTypes: ['indicator'] },
  { sourceType: 'course-of-action', relationshipType: 'mitigates', targetTypes: ['attack-pattern', 'indicator', 'malware', 'tool', 'vulnerability'] },
  { sourceType: 'course-of-action', relationshipType: 'remediates', targetTypes: ['malware', 'vulnerability'] },

  // identity
  { sourceType: 'identity', relationshipType: 'located-at', targetTypes: ['location'] },

  // indicator
  { sourceType: 'indicator', relationshipType: 'indicates', targetTypes: ['attack-pattern', 'campaign', 'infrastructure', 'intrusion-set', 'malware', 'threat-actor', 'tool'] },
  { sourceType: 'indicator', relationshipType: 'based-on', targetTypes: ['observed-data'] },

  // infrastructure
  { sourceType: 'infrastructure', relationshipType: 'communicates-with', targetTypes: ['infrastructure', 'ipv4-addr', 'ipv6-addr', 'domain-name', 'url'] },
  { sourceType: 'infrastructure', relationshipType: 'consists-of', targetTypes: ['infrastructure', 'observed-data', 'artifact', 'autonomous-system', 'directory', 'domain-name', 'email-addr', 'email-message', 'file', 'ipv4-addr', 'ipv6-addr', 'mac-addr', 'mutex', 'network-traffic', 'process', 'software', 'url', 'user-account', 'windows-registry-key', 'x509-certificate'] },
  { sourceType: 'infrastructure', relationshipType: 'controls', targetTypes: ['infrastructure', 'malware'] },
  { sourceType: 'infrastructure', relationshipType: 'delivers', targetTypes: ['malware'] },
  { sourceType: 'infrastructure', relationshipType: 'has', targetTypes: ['vulnerability'] },
  { sourceType: 'infrastructure', relationshipType: 'hosts', targetTypes: ['tool', 'malware'] },
  { sourceType: 'infrastructure', relationshipType: 'located-at', targetTypes: ['location'] },
  { sourceType: 'infrastructure', relationshipType: 'uses', targetTypes: ['infrastructure'] },

  // intrusion-set
  { sourceType: 'intrusion-set', relationshipType: 'attributed-to', targetTypes: ['threat-actor'] },
  { sourceType: 'intrusion-set', relationshipType: 'compromises', targetTypes: ['infrastructure'] },
  { sourceType: 'intrusion-set', relationshipType: 'hosts', targetTypes: ['infrastructure'] },
  { sourceType: 'intrusion-set', relationshipType: 'originates-from', targetTypes: ['location'] },
  { sourceType: 'intrusion-set', relationshipType: 'owns', targetTypes: ['infrastructure'] },
  { sourceType: 'intrusion-set', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'intrusion-set', relationshipType: 'uses', targetTypes: ['attack-pattern', 'infrastructure', 'malware', 'tool'] },

  // malware
  { sourceType: 'malware', relationshipType: 'authored-by', targetTypes: ['threat-actor', 'intrusion-set'] },
  { sourceType: 'malware', relationshipType: 'beacons-to', targetTypes: ['infrastructure'] },
  { sourceType: 'malware', relationshipType: 'communicates-with', targetTypes: ['ipv4-addr', 'ipv6-addr', 'domain-name', 'url'] },
  { sourceType: 'malware', relationshipType: 'controls', targetTypes: ['malware'] },
  { sourceType: 'malware', relationshipType: 'downloads', targetTypes: ['malware', 'tool', 'file'] },
  { sourceType: 'malware', relationshipType: 'drops', targetTypes: ['malware', 'tool', 'file'] },
  { sourceType: 'malware', relationshipType: 'exploits', targetTypes: ['vulnerability'] },
  { sourceType: 'malware', relationshipType: 'exfiltrates-to', targetTypes: ['infrastructure'] },
  { sourceType: 'malware', relationshipType: 'originates-from', targetTypes: ['location'] },
  { sourceType: 'malware', relationshipType: 'targets', targetTypes: ['identity', 'infrastructure', 'location', 'vulnerability'] },
  { sourceType: 'malware', relationshipType: 'uses', targetTypes: ['attack-pattern', 'infrastructure', 'malware', 'tool'] },
  { sourceType: 'malware', relationshipType: 'variant-of', targetTypes: ['malware'] },

  // malware-analysis
  { sourceType: 'malware-analysis', relationshipType: 'characterizes', targetTypes: ['malware'] },
  { sourceType: 'malware-analysis', relationshipType: 'av-analysis-of', targetTypes: ['malware'] },
  { sourceType: 'malware-analysis', relationshipType: 'static-analysis-of', targetTypes: ['malware'] },
  { sourceType: 'malware-analysis', relationshipType: 'dynamic-analysis-of', targetTypes: ['malware'] },

  // threat-actor
  { sourceType: 'threat-actor', relationshipType: 'attributed-to', targetTypes: ['identity'] },
  { sourceType: 'threat-actor', relationshipType: 'compromises', targetTypes: ['infrastructure'] },
  { sourceType: 'threat-actor', relationshipType: 'hosts', targetTypes: ['infrastructure'] },
  { sourceType: 'threat-actor', relationshipType: 'impersonates', targetTypes: ['identity'] },
  { sourceType: 'threat-actor', relationshipType: 'located-at', targetTypes: ['location'] },
  { sourceType: 'threat-actor', relationshipType: 'owns', targetTypes: ['infrastructure'] },
  { sourceType: 'threat-actor', relationshipType: 'targets', targetTypes: ['identity', 'location', 'vulnerability'] },
  { sourceType: 'threat-actor', relationshipType: 'uses', targetTypes: ['attack-pattern', 'infrastructure', 'malware', 'tool'] },

  // tool
  { sourceType: 'tool', relationshipType: 'delivers', targetTypes: ['malware'] },
  { sourceType: 'tool', relationshipType: 'drops', targetTypes: ['malware'] },
  { sourceType: 'tool', relationshipType: 'has', targetTypes: ['vulnerability'] },
  { sourceType: 'tool', relationshipType: 'targets', targetTypes: ['identity', 'infrastructure', 'location', 'vulnerability'] },
  { sourceType: 'tool', relationshipType: 'uses', targetTypes: ['infrastructure'] },

  // domain-name
  { sourceType: 'domain-name', relationshipType: 'resolves-to', targetTypes: ['domain-name', 'ipv4-addr', 'ipv6-addr'] },

  // ipv4-addr
  { sourceType: 'ipv4-addr', relationshipType: 'resolves-to', targetTypes: ['mac-addr'] },
  { sourceType: 'ipv4-addr', relationshipType: 'belongs-to', targetTypes: ['autonomous-system'] },

  // ipv6-addr
  { sourceType: 'ipv6-addr', relationshipType: 'resolves-to', targetTypes: ['mac-addr'] },
  { sourceType: 'ipv6-addr', relationshipType: 'belongs-to', targetTypes: ['autonomous-system'] },
];
