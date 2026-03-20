export const examples: Record<string, Record<string, unknown>> = {
  // ─── SDOs (19) ────────────────────────────────────────────────────────

  'attack-pattern': {
    type: 'attack-pattern',
    spec_version: '2.1',
    id: 'attack-pattern--0c7b5b88-8ff7-4a4d-aa9d-feb398cd0061',
    created: '2016-05-12T08:17:27.000Z',
    modified: '2016-05-12T08:17:27.000Z',
    name: 'Spear Phishing',
    description:
      'Used to target specific individuals or groups within an organization via crafted emails containing malicious attachments or links.',
    external_references: [
      { source_name: 'capec', external_id: 'CAPEC-163' },
    ],
    kill_chain_phases: [
      {
        kill_chain_name: 'lockheed-martin-cyber-kill-chain',
        phase_name: 'delivery',
      },
    ],
  },

  campaign: {
    type: 'campaign',
    spec_version: '2.1',
    id: 'campaign--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    created: '2016-04-06T20:03:00.000Z',
    modified: '2016-04-06T20:03:00.000Z',
    name: 'Operation Shady RAT',
    description:
      'A series of cyber attacks starting in mid-2006, targeting at least 72 organizations including governments, defense contractors, and technology companies.',
    first_seen: '2006-06-01T00:00:00.000Z',
    last_seen: '2011-08-01T00:00:00.000Z',
    objective: 'Intellectual property theft and espionage',
  },

  'course-of-action': {
    type: 'course-of-action',
    spec_version: '2.1',
    id: 'course-of-action--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    created: '2016-04-06T20:03:48.000Z',
    modified: '2016-04-06T20:03:48.000Z',
    name: 'Block Outbound Traffic to Known C2 Servers',
    description:
      'Implement firewall rules to block outbound network traffic to known command-and-control server IP addresses and domains.',
  },

  grouping: {
    type: 'grouping',
    spec_version: '2.1',
    id: 'grouping--84e4d88f-44ea-4bcd-bbf3-b2c1c320bcb3',
    created: '2020-10-25T14:22:00.000Z',
    modified: '2020-10-25T14:22:00.000Z',
    name: 'SolarWinds Supply Chain Compromise Artifacts',
    context: 'suspicious-activity',
    object_refs: [
      'malware--c8b65e5d-7e17-4e50-b5b0-927a37b111f3',
      'indicator--a932fcc6-e032-476c-826f-cb970a5a1ade',
    ],
  },

  identity: {
    type: 'identity',
    spec_version: '2.1',
    id: 'identity--311b2d2d-f010-4473-83ec-1edf84858f4c',
    created: '2015-12-21T19:59:11.000Z',
    modified: '2015-12-21T19:59:11.000Z',
    name: 'ACME Threat Intelligence',
    identity_class: 'organization',
    sectors: ['technology', 'defense'],
    contact_information: 'threat-intel@acme-corp.example.com',
  },

  incident: {
    type: 'incident',
    spec_version: '2.1',
    id: 'incident--b1590d8b-e53c-4e2b-abc3-28e3b1bb8230',
    created: '2023-01-15T10:30:00.000Z',
    modified: '2023-01-16T08:00:00.000Z',
    name: 'Ransomware Incident at Regional Hospital',
    description:
      'LockBit 3.0 ransomware deployed across hospital network after initial access via exposed RDP service. Patient records encrypted; backup restoration initiated.',
  },

  indicator: {
    type: 'indicator',
    spec_version: '2.1',
    id: 'indicator--a932fcc6-e032-476c-826f-cb970a5a1ade',
    created: '2017-04-14T13:07:49.000Z',
    modified: '2017-04-14T13:07:49.000Z',
    name: 'Emotet C2 Domain',
    description: 'Known Emotet command-and-control domain observed in active campaigns.',
    pattern: "[domain-name:value = 'evil-c2.example.com']",
    pattern_type: 'stix',
    valid_from: '2017-04-14T13:07:49.000Z',
    indicator_types: ['malicious-activity'],
    kill_chain_phases: [
      {
        kill_chain_name: 'lockheed-martin-cyber-kill-chain',
        phase_name: 'command-and-control',
      },
    ],
  },

  infrastructure: {
    type: 'infrastructure',
    spec_version: '2.1',
    id: 'infrastructure--38c47d93-d984-4fd9-b87b-d69d0841628d',
    created: '2021-07-01T12:00:00.000Z',
    modified: '2021-07-01T12:00:00.000Z',
    name: 'Cobalt Strike Beacon C2 Server',
    description:
      'Cobalt Strike team server used for command-and-control, hosted on bulletproof infrastructure in Eastern Europe.',
    infrastructure_types: ['command-and-control'],
    first_seen: '2021-04-15T00:00:00.000Z',
  },

  'intrusion-set': {
    type: 'intrusion-set',
    spec_version: '2.1',
    id: 'intrusion-set--4e78f46f-a023-4e5f-bc24-71b3ca22ec29',
    created: '2016-04-06T20:03:48.000Z',
    modified: '2016-04-06T20:03:48.000Z',
    name: 'APT28',
    description:
      'APT28 is a threat group attributed to Russian military intelligence. Active since at least 2004, targeting governments, militaries, and security organizations.',
    aliases: ['Fancy Bear', 'Sofacy', 'Pawn Storm', 'Sednit'],
    first_seen: '2004-01-01T00:00:00.000Z',
    goals: ['Espionage', 'Intelligence collection'],
    resource_level: 'government',
    primary_motivation: 'political',
  },

  location: {
    type: 'location',
    spec_version: '2.1',
    id: 'location--a6e9345f-5a15-4c29-8bb3-7dcc5d168d64',
    created: '2016-04-06T20:03:00.000Z',
    modified: '2016-04-06T20:03:00.000Z',
    name: 'United States',
    region: 'northern-america',
    country: 'US',
    latitude: 38.8895,
    longitude: -77.0353,
  },

  malware: {
    type: 'malware',
    spec_version: '2.1',
    id: 'malware--c8b65e5d-7e17-4e50-b5b0-927a37b111f3',
    created: '2017-05-31T21:33:10.000Z',
    modified: '2017-05-31T21:33:10.000Z',
    name: 'SUNBURST',
    description:
      'SUNBURST is a sophisticated backdoor trojanized into SolarWinds Orion software updates. It communicates via HTTP to third-party servers to receive commands.',
    malware_types: ['backdoor', 'trojan'],
    is_family: false,
    kill_chain_phases: [
      {
        kill_chain_name: 'lockheed-martin-cyber-kill-chain',
        phase_name: 'installation',
      },
    ],
  },

  'malware-analysis': {
    type: 'malware-analysis',
    spec_version: '2.1',
    id: 'malware-analysis--d7129874-4e9d-4b5e-97e2-0a33a3e568c6',
    created: '2021-02-10T14:22:00.000Z',
    modified: '2021-02-10T14:22:00.000Z',
    product: 'VirusTotal',
    result: 'malicious',
    analysis_sco_refs: ['file--fb0aeec0-1c44-508b-8401-3a6e1cbb4a9c'],
    submitted: '2021-02-10T12:00:00.000Z',
    analysis_started: '2021-02-10T12:01:00.000Z',
    analysis_ended: '2021-02-10T12:05:00.000Z',
  },

  note: {
    type: 'note',
    spec_version: '2.1',
    id: 'note--0c7b5b88-8ff7-4a4d-aa9d-feb398cd0061',
    created: '2016-05-12T08:17:27.000Z',
    modified: '2016-05-12T08:17:27.000Z',
    abstract: 'Analyst assessment of APT28 campaign targeting European elections',
    content:
      'The indicators observed in this campaign are consistent with previously documented APT28 TTPs. The infrastructure reuse suggests medium-high confidence attribution.',
    authors: ['John Doe'],
    object_refs: ['campaign--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f'],
  },

  'observed-data': {
    type: 'observed-data',
    spec_version: '2.1',
    id: 'observed-data--b67d30ff-02ac-498a-92f9-32f845f448cf',
    created: '2016-04-06T19:58:16.000Z',
    modified: '2016-04-06T19:58:16.000Z',
    first_observed: '2015-12-21T19:00:00Z',
    last_observed: '2015-12-21T19:00:00Z',
    number_observed: 50,
    object_refs: ['ipv4-addr--ff26966f-0000-4000-8000-f79c7a8e96a4'],
  },

  opinion: {
    type: 'opinion',
    spec_version: '2.1',
    id: 'opinion--b01efc25-77b4-4003-b18b-f6e24b5cd9f7',
    created: '2016-05-12T08:17:27.000Z',
    modified: '2016-05-12T08:17:27.000Z',
    opinion: 'strongly-agree',
    explanation:
      'The malware sample analysis and C2 infrastructure overlap strongly support the attribution to APT28.',
    authors: ['Jane Smith'],
    object_refs: ['intrusion-set--4e78f46f-a023-4e5f-bc24-71b3ca22ec29'],
  },

  report: {
    type: 'report',
    spec_version: '2.1',
    id: 'report--84e4d88f-44ea-4bcd-bbf3-b2c1c320bcbd',
    created: '2017-02-23T14:45:00.000Z',
    modified: '2017-02-23T14:45:00.000Z',
    name: 'APT28 Targeting of European Government Entities',
    description:
      'This report details the APT28 campaign targeting European government entities during 2016-2017, including TTPs, indicators, and recommended mitigations.',
    report_types: ['threat-report'],
    published: '2017-02-23T14:45:00.000Z',
    object_refs: [
      'intrusion-set--4e78f46f-a023-4e5f-bc24-71b3ca22ec29',
      'campaign--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    ],
  },

  'threat-actor': {
    type: 'threat-actor',
    spec_version: '2.1',
    id: 'threat-actor--56f3f0db-b5d5-431c-ae56-c18f02caf500',
    created: '2014-12-22T18:39:15.000Z',
    modified: '2014-12-22T18:39:15.000Z',
    name: 'Fancy Bear',
    description:
      'State-sponsored threat actor group attributed to the Russian GRU (Unit 26165). Known for targeting governments, military, and security organizations worldwide.',
    threat_actor_types: ['nation-state'],
    aliases: ['APT28', 'Sofacy', 'Pawn Storm'],
    roles: ['agent'],
    sophistication: 'expert',
    resource_level: 'government',
    primary_motivation: 'political',
  },

  tool: {
    type: 'tool',
    spec_version: '2.1',
    id: 'tool--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    created: '2016-04-06T20:03:48.000Z',
    modified: '2016-04-06T20:03:48.000Z',
    name: 'Mimikatz',
    description:
      'Credential dumping tool capable of extracting plaintext passwords, hashes, PIN codes, and Kerberos tickets from memory.',
    tool_types: ['credential-exploitation'],
    kill_chain_phases: [
      {
        kill_chain_name: 'lockheed-martin-cyber-kill-chain',
        phase_name: 'actions-on-objectives',
      },
    ],
  },

  vulnerability: {
    type: 'vulnerability',
    spec_version: '2.1',
    id: 'vulnerability--0c7b5b88-8ff7-4a4d-aa9d-feb398cd0062',
    created: '2021-12-10T20:00:00.000Z',
    modified: '2021-12-14T20:00:00.000Z',
    name: 'Log4Shell',
    description:
      'Apache Log4j2 JNDI features do not protect against attacker-controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers.',
    external_references: [
      { source_name: 'cve', external_id: 'CVE-2021-44228' },
    ],
  },

  // ─── SROs (2) ─────────────────────────────────────────────────────────

  relationship: {
    type: 'relationship',
    spec_version: '2.1',
    id: 'relationship--44298a74-ba52-4f0c-87a3-1824e67d7fad',
    created: '2016-04-06T20:06:37.000Z',
    modified: '2016-04-06T20:06:37.000Z',
    relationship_type: 'uses',
    source_ref: 'threat-actor--56f3f0db-b5d5-431c-ae56-c18f02caf500',
    target_ref: 'malware--c8b65e5d-7e17-4e50-b5b0-927a37b111f3',
    description: 'Fancy Bear has been observed using SUNBURST malware in targeted operations.',
  },

  sighting: {
    type: 'sighting',
    spec_version: '2.1',
    id: 'sighting--ee20065d-2555-424f-ad9e-0f8428623c75',
    created: '2017-02-28T19:37:11.000Z',
    modified: '2017-02-28T19:37:11.000Z',
    first_seen: '2017-02-27T21:37:11.000Z',
    last_seen: '2017-02-27T21:37:11.000Z',
    count: 1,
    sighting_of_ref: 'indicator--a932fcc6-e032-476c-826f-cb970a5a1ade',
    where_sighted_refs: ['identity--311b2d2d-f010-4473-83ec-1edf84858f4c'],
    observed_data_refs: ['observed-data--b67d30ff-02ac-498a-92f9-32f845f448cf'],
  },

  // ─── SCOs (18) ────────────────────────────────────────────────────────

  artifact: {
    type: 'artifact',
    id: 'artifact--cb37bcf8-9846-5ab4-8662-75c1bf6e63ee',
    mime_type: 'application/pdf',
    hashes: {
      'SHA-256': 'ceafbfd424be2ca4a5f0402cae090dda2fb0526cf521b60b60077c0f622b285c',
    },
    payload_bin: 'VBORw0KGgo...',
  },

  'autonomous-system': {
    type: 'autonomous-system',
    id: 'autonomous-system--f720c34b-98ae-597f-ade5-27dc241e8c74',
    number: 15169,
    name: 'GOOGLE',
    rir: 'ARIN',
  },

  directory: {
    type: 'directory',
    id: 'directory--93c0a9b0-520d-545d-9094-1a08ddf46b05',
    path: 'C:\\Windows\\System32',
    path_enc: 'windows-1252',
    ctime: '2019-10-12T07:20:50.52Z',
    mtime: '2023-06-15T14:30:00.00Z',
  },

  'domain-name': {
    type: 'domain-name',
    id: 'domain-name--3c10e93f-798e-5a26-a0c1-08156efab7f5',
    value: 'evil-c2.example.com',
    resolves_to_refs: ['ipv4-addr--ff26966f-0000-4000-8000-f79c7a8e96a4'],
  },

  'email-addr': {
    type: 'email-addr',
    id: 'email-addr--2d77a846-6264-5d51-b586-e43bb7f8daa2',
    value: 'phishing@evil-c2.example.com',
    display_name: 'IT Support',
  },

  'email-message': {
    type: 'email-message',
    id: 'email-message--72b7698f-10c2-565a-a2a6-b4996a2f2265',
    is_multipart: false,
    date: '2023-06-14T08:15:00.000Z',
    from_ref: 'email-addr--2d77a846-6264-5d51-b586-e43bb7f8daa2',
    to_refs: ['email-addr--89f52ea8-d6ef-51e9-8fce-6a29236436ed'],
    subject: 'Urgent: Password Reset Required',
    body: 'Dear user, your password has expired. Click the link below to reset it immediately...',
    content_type: 'text/plain',
  },

  file: {
    type: 'file',
    id: 'file--fb0aeec0-1c44-508b-8401-3a6e1cbb4a9c',
    name: 'SolarWinds.Orion.Core.BusinessLayer.dll',
    size: 1028096,
    hashes: {
      'SHA-256': 'ce77d116a074dab7a22a0fd4f2c1ab475f16eec42e1ded3c0b0aa8211fe858d6',
      MD5: 'b91ce2fa41029f6955bff20079468448',
    },
    mime_type: 'application/x-dosexec',
  },

  'ipv4-addr': {
    type: 'ipv4-addr',
    id: 'ipv4-addr--ff26966f-0000-4000-8000-f79c7a8e96a4',
    value: '198.51.100.3',
    resolves_to_refs: ['mac-addr--65cfcf98-8a6e-5a1b-8f61-379ac4f92d00'],
  },

  'ipv6-addr': {
    type: 'ipv6-addr',
    id: 'ipv6-addr--1e61d36c-a26c-53a7-af2a-eb2b01f15f5a',
    value: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    resolves_to_refs: ['mac-addr--65cfcf98-8a6e-5a1b-8f61-379ac4f92d00'],
  },

  'mac-addr': {
    type: 'mac-addr',
    id: 'mac-addr--65cfcf98-8a6e-5a1b-8f61-379ac4f92d00',
    value: '00:1B:44:11:3A:B7',
  },

  mutex: {
    type: 'mutex',
    id: 'mutex--eba44954-d4e4-5d3b-814c-2b17dd8de300',
    name: 'Global\\SUNBURST_MUTEX_2020',
  },

  'network-traffic': {
    type: 'network-traffic',
    id: 'network-traffic--2568d22a-8998-58eb-99ec-3c8ca74f527d',
    src_ref: 'ipv4-addr--ff26966f-0000-4000-8000-f79c7a8e96a4',
    dst_ref: 'ipv4-addr--a43d3567-1234-4000-8000-aabbccddeeff',
    protocols: ['tcp', 'http'],
    src_port: 49152,
    dst_port: 443,
    start: '2023-06-14T08:15:00.000Z',
    end: '2023-06-14T08:17:30.000Z',
  },

  process: {
    type: 'process',
    id: 'process--f52a906a-0dfc-40bd-92f1-e4b5aaf0b1e3',
    pid: 4712,
    command_line: 'cmd.exe /c whoami && net user /domain',
    created_time: '2023-06-14T08:16:00.000Z',
    image_ref: 'file--fb0aeec0-1c44-508b-8401-3a6e1cbb4a9c',
    creator_user_ref: 'user-account--0d5b424b-93b8-5cd8-ac36-306e1789d63c',
  },

  software: {
    type: 'software',
    id: 'software--a1195f04-c279-5ae3-9e4b-1a0bff4706a8',
    name: 'Microsoft Windows',
    vendor: 'Microsoft',
    version: '10.0.19041',
    cpe: 'cpe:2.3:o:microsoft:windows_10:1909:*:*:*:*:*:*:*',
  },

  url: {
    type: 'url',
    id: 'url--c1477287-23ac-5971-a010-5c287ef942f2',
    value: 'https://evil-c2.example.com/update/check?token=a3f9b71c',
  },

  'user-account': {
    type: 'user-account',
    id: 'user-account--0d5b424b-93b8-5cd8-ac36-306e1789d63c',
    user_id: '1001',
    account_login: 'jdoe',
    account_type: 'windows-domain',
    display_name: 'John Doe',
    is_privileged: true,
  },

  'windows-registry-key': {
    type: 'windows-registry-key',
    id: 'windows-registry-key--2ba37ae7-2745-5082-9dfd-9486dad41016',
    key: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\SolarWinds\\Orion',
    values: [
      {
        name: 'Start',
        data: '0x00000002',
        data_type: 'REG_DWORD',
      },
    ],
    modified_time: '2020-12-13T00:00:00.000Z',
  },

  'x509-certificate': {
    type: 'x509-certificate',
    id: 'x509-certificate--463d36b8-70d0-516b-b7cf-21cef7bf0410',
    issuer: 'CN=DigiCert SHA2 Assured ID Code Signing CA, OU=www.digicert.com, O=DigiCert Inc, C=US',
    subject: 'CN=SolarWinds Worldwide LLC, O=SolarWinds Worldwide LLC, L=Austin, ST=Texas, C=US',
    serial_number: '0F:E9:B0:A8:73:31:4B:04:4D:F9:56:8B:7D:C1:7E:4F',
    validity_not_before: '2019-01-28T00:00:00.000Z',
    validity_not_after: '2022-01-22T12:00:00.000Z',
    hashes: {
      'SHA-256': '53f8dfc65169ccda021b72a62e0c22a4db7c4077f002fa742717d41b3c40f2c7',
    },
  },

  // ─── Meta (4) ─────────────────────────────────────────────────────────

  bundle: {
    type: 'bundle',
    id: 'bundle--44af6c39-c09b-49c5-9de2-394a0cd87410',
    objects: [
      {
        type: 'indicator',
        spec_version: '2.1',
        id: 'indicator--a932fcc6-e032-476c-826f-cb970a5a1ade',
        created: '2017-04-14T13:07:49.000Z',
        modified: '2017-04-14T13:07:49.000Z',
        name: 'Emotet C2 Domain',
        pattern: "[domain-name:value = 'evil-c2.example.com']",
        pattern_type: 'stix',
        valid_from: '2017-04-14T13:07:49.000Z',
      },
    ],
  },

  'extension-definition': {
    type: 'extension-definition',
    spec_version: '2.1',
    id: 'extension-definition--fb9c968a-745b-4ade-9b25-c324172197f4',
    created: '2022-03-15T12:00:00.000Z',
    modified: '2022-03-15T12:00:00.000Z',
    name: 'Incident Core Extension',
    description:
      'Extends the incident SDO with additional structured fields for severity, impact, and response status.',
    schema:
      'https://example.com/schemas/incident-ext/v1.0/schema.json',
    version: '1.0.0',
    extension_types: ['property-extension'],
    created_by_ref: 'identity--311b2d2d-f010-4473-83ec-1edf84858f4c',
  },

  'language-content': {
    type: 'language-content',
    spec_version: '2.1',
    id: 'language-content--b86bd89f-98bb-4fa9-8cb2-b3269b1fba92',
    created: '2017-02-08T21:31:22.000Z',
    modified: '2017-02-08T21:31:22.000Z',
    object_ref: 'campaign--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    object_modified: '2016-04-06T20:03:00.000Z',
    contents: {
      de: {
        name: 'Operation Schattiger RAT',
        description: 'Eine Reihe von Cyberangriffen ab Mitte 2006.',
      },
    },
  },

  'marking-definition': {
    type: 'marking-definition',
    spec_version: '2.1',
    id: 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9',
    created: '2017-01-20T00:00:00.000Z',
    definition_type: 'tlp',
    name: 'TLP:WHITE',
    definition: { tlp: 'white' },
  },
};
