/* ============================================================
   SANNI DAY RESIDENTIAL GROUP — DOCUMENTATION TRAINING
   app.js | Voice select · 11 Scenarios · AI Grading · Save/Resume · Cert · Email
   ============================================================ */

/* ---------- safe storage ---------- */
const _ls = window[('local') + ('Storage')];
const SAVE_KEY = 'sdrg_doc_v1';
function safeGet()  { try { const v = _ls.getItem(SAVE_KEY); return v ? JSON.parse(v) : null; } catch(e) { return null; } }
function safeSet(o) { try { _ls.setItem(SAVE_KEY, JSON.stringify(o)); } catch(e) {} }
function safeClear(){ try { _ls.removeItem(SAVE_KEY); } catch(e) {} }

/* ---------- email (EmailJS) ---------- */
const EJS_SERVICE  = 'service_sdrg_fire';
const EJS_TEMPLATE = 'template_sdrg_cert';
const EJS_PUBLIC   = 'YOUR_EMAILJS_PUBLIC_KEY';
const ADMIN_EMAIL  = 'admin@sannidayresidential.org';

/* ---------- per-scenario audio timestamps (seconds) ----------
   The narration intro covers all 11 scenarios in order.
   These are the exact times each scenario is introduced.
   Source: word-level transcription of both audio files.
*/
const ALEX_SCENARIO_TS  = [111.0, 133.8, 152.3, 171.9, 190.4, 207.1, 225.2, 242.1, 258.2, 280.3, 301.8];
const SARAH_SCENARIO_TS = [105.7, 126.7, 145.1, 163.3, 180.0, 195.6, 212.6, 228.8, 245.0, 266.0, 286.4];

/* ---------- state ---------- */
let selectedVoice    = null;
let currentScenario  = 0;
let scores           = new Array(11).fill(null);
let attempts         = new Array(11).fill(0);
let gradedNote       = '';
let sigPainting      = false;
let sigCtx           = null;
let sigHasData       = false;
let autoSyncEnabled  = true;  // auto-advance scenarios with audio

const PASS_SCORE     = 8;
const TOTAL_SCENARIOS= 11;

/* ---------- DOM helpers ---------- */
const $v = id => document.getElementById(id);

/* ============================================================
   SCENARIOS DATA
   ============================================================ */
const SCENARIOS = [
  {
    id: 1,
    tag: 'Scenario 1',
    title: 'Emotional Dysregulation After School',
    content: `
      <p>Resident returned from school at approximately <strong>3:15 PM</strong> appearing visibly upset. Resident entered the home crying, slammed her backpack on the floor, and stated, "I hate that school. Nobody listens to me."</p>
      <p>When staff attempted to speak with resident, resident initially refused to talk and went to her bedroom. Resident then began yelling and throwing clothing items around the room.</p>
      <p>Staff maintained calm tone, gave resident space for several minutes, and continued monitoring for safety. Staff then approached resident and encouraged use of coping skills previously discussed in treatment, including deep breathing and taking a short break before processing the issue.</p>
      <p>Resident eventually reported that another student had been making fun of her during class and she became overwhelmed. Staff processed the situation with resident, discussed appropriate ways to handle peer conflict, and praised resident for calming down without harming herself or others.</p>
      <p>Resident later completed hygiene, ate dinner, and participated in evening journaling activity with no further behavioral concerns.</p>`,
    task: 'Document resident presentation, behaviors observed, staff interventions, resident response, shift outcome, and continued treatment needs.',
    acceptable: 'Resident returned from school at approximately 3:15 PM visibly upset and tearful. Upon arrival, resident slammed backpack to the floor and verbalized frustration regarding school environment. Resident initially refused staff support, went to bedroom, and began yelling while throwing clothing items within room area. Staff maintained calm approach, monitored for safety, and allowed resident brief space to de-escalate. Staff then encouraged use of previously identified coping strategies, including deep breathing and taking time before discussing concerns. Resident became receptive to support and reported experiencing peer conflict at school, which contributed to emotional distress. Staff processed appropriate responses to conflict, reinforced emotional regulation skills, and praised resident for regaining control without aggression toward self or others. Resident later completed hygiene routine, ate dinner appropriately, and participated in evening journaling activity. Continued support needed with frustration tolerance, peer conflict management, and emotional regulation.',
    unacceptable: 'Client came home mad from school. She cried and threw stuff. Staff talked to her and she calmed down. Ate dinner and was fine after.',
    whyBad: 'Too vague. No clinical detail. No interventions described. No treatment relevance. No objective language. No continued needs identified.',
    followup: [
      'What behaviors in this scenario required documentation?',
      'Which staff interventions were clinically appropriate?',
      'Why is it important to document that resident later stabilized?',
      'How does this note support medical necessity?',
      'What wording should be avoided in this scenario?'
    ],
    advanced: 'Ask the employee to rewrite the note in stronger clinical language after their first attempt, focusing on using measurable descriptors.'
  },
  {
    id: 2,
    tag: 'Scenario 2',
    title: 'Refusal to Shower',
    content: `
      <p>At approximately <strong>7:45 PM</strong>, staff prompted resident to complete her evening hygiene routine, including showering. Resident refused, stating "I already showered yesterday" and walked away from staff.</p>
      <p>Staff calmly re-approached and explained the facility's daily hygiene expectations. Resident became verbally agitated, stating "You can't make me do anything." Staff offered a choice: shower now or in 20 minutes. Resident continued to refuse and sat on couch watching television.</p>
      <p>Staff provided motivational encouragement, reminded resident of personal hygiene goals from her treatment plan, and allowed 15 minutes before re-prompting. On second prompt, resident agreed to shower under protest. Resident completed hygiene in approximately 12 minutes and returned to common area.</p>
      <p>Resident later participated in evening programming without further behavioral issues.</p>`,
    task: 'Document the refusal, staff approach, resident response, resolution, and any treatment relevance.',
    acceptable: 'At approximately 7:45 PM, resident refused staff prompt to complete evening hygiene routine, stating she had showered the previous day and that she did not have to comply. Resident became verbally agitated when staff explained hygiene expectations and offered a structured choice of completing hygiene immediately or within 20 minutes. Resident declined initial prompt and disengaged by watching television. Staff provided calm motivational support, reinforced hygiene goals identified in resident\'s treatment plan, and re-approached after 15 minutes. On second staff prompt, resident verbally protested but agreed to complete shower. Resident completed hygiene routine in approximately 12 minutes and returned to common area without further behavioral concerns. Continued support warranted for treatment plan goals related to daily hygiene compliance and response to staff redirection.',
    unacceptable: 'Resident didn\'t want to shower. Staff told her she had to and eventually she did. No problems after.',
    whyBad: 'No time documentation. No specific dialogue or behavior captured. Interventions not described. No clinical connection to treatment plan. Language is colloquial and non-professional.',
    followup: [
      'Why does hygiene refusal need to be documented even when it resolves?',
      'What makes "offering a choice" a clinically appropriate intervention?',
      'How would you document this if the resident never agreed to shower?',
      'What treatment plan connection should be referenced in this note?',
      'How does your language change if the refusal escalated to aggression?'
    ],
    advanced: 'Ask the employee how their note would change if the resident had a sensory processing diagnosis that affected her tolerance for hygiene tasks.'
  },
  {
    id: 3,
    tag: 'Scenario 3',
    title: 'Argument Over Phone Privileges',
    content: `
      <p>At <strong>8:00 PM</strong>, staff informed resident that her daily phone time of 30 minutes had ended. Resident demanded additional time, stating she was "in the middle of something important." Staff calmly explained the policy and began the process of collecting the phone.</p>
      <p>Resident became loud and verbally confrontational, raising her voice and stating staff were "being unfair" and "always picking on her." Resident refused to surrender the phone and moved to her bedroom.</p>
      <p>Staff followed facility protocol, allowed resident a brief transition period of five minutes, then re-entered to collect the device. Resident verbalized continued displeasure but surrendered the phone without physical incident.</p>
      <p>Staff validated resident's frustration, reviewed the phone policy with resident, and reminded her of the appeal process through her case manager. Resident settled and rejoined evening activities within 20 minutes.</p>`,
    task: 'Document the trigger, behavioral escalation, staff intervention, resident response, and resolution.',
    acceptable: 'At 8:00 PM, staff notified resident that daily phone allotment of 30 minutes had concluded and initiated phone collection. Resident verbally objected, stating she was engaged in an important task and demanding additional time. When staff maintained policy boundary, resident became verbally escalated, raising voice and alleging unfair treatment by staff. Resident refused initial surrender of device and retreated to bedroom. Staff followed facility protocol, allowed five-minute transition period, then re-entered bedroom to retrieve phone. Resident verbalized continued displeasure but complied without physical altercation. Staff validated resident\'s emotional response, reviewed phone privilege policy, and informed resident of appeal process through assigned case manager. Resident returned to common area and participated in evening activities within approximately 20 minutes with no further behavioral concerns. Continued support indicated for frustration tolerance, compliance with facility policies, and appropriate conflict resolution.',
    unacceptable: 'Resident got upset about her phone. We took it. She calmed down and came back out.',
    whyBad: 'No time noted. No specific behaviors described. No intervention detail. Tone is dismissive. No treatment needs identified. Does not support clinical record.',
    followup: [
      'Why is it important to document that staff "followed facility protocol"?',
      'How does documenting the resident\'s specific statements protect the organization?',
      'What does "verbal escalation" mean clinically versus behaviorally?',
      'Why should you document that there was no physical incident?',
      'How would your note change if another resident witnessed the argument?'
    ],
    advanced: 'Ask the employee to write a separate note from the perspective of the second staff member present during the collection of the phone.'
  },
  {
    id: 4,
    tag: 'Scenario 4',
    title: 'Theft From a Peer',
    content: `
      <p>At approximately <strong>2:30 PM</strong>, Resident B approached staff and reported that her earrings were missing from her dresser. Resident B stated she believed Resident A had taken them after entering her room earlier that morning.</p>
      <p>Staff spoke with Resident A privately in the office. When asked about the earrings, Resident A initially denied any knowledge, then became defensive and stated "she leaves her stuff everywhere anyway." Staff maintained a non-confrontational approach and asked Resident A to voluntarily return any items that did not belong to her.</p>
      <p>After several minutes, Resident A retrieved a small bag from under her mattress containing Resident B's earrings and two lip glosses. Resident A returned the items to staff and stated she "didn't think it was a big deal."</p>
      <p>Staff addressed the behavior therapeutically with Resident A, discussed boundaries and respect for peers, and documented the incident for clinical team review. Resident B was informed of item recovery. No physical altercation occurred between residents.</p>`,
    task: 'Document the discovery, staff approach, findings, therapeutic response, and outcome for both residents.',
    acceptable: 'At approximately 2:30 PM, Resident B reported to staff that personal jewelry items were missing from her bedroom dresser and stated she believed Resident A had taken them. Staff privately interviewed Resident A in the office using a calm, non-confrontational approach. Resident A initially denied knowledge of the items, then became verbally defensive, minimizing the situation. Staff encouraged voluntary return of any items not belonging to Resident A. After brief processing, Resident A retrieved a bag from under her mattress containing Resident B\'s earrings and two lip gloss items and surrendered them to staff. Staff addressed the behavior therapeutically with Resident A, emphasizing peer boundaries, personal property rights, and the impact of taking others\' belongings. Resident B was notified of item recovery. No physical altercation occurred between residents during this incident. Incident documented for clinical team review and treatment planning purposes. Continued therapeutic support recommended regarding impulse control, peer boundaries, and honesty.',
    unacceptable: 'One resident took another resident\'s stuff. We found it under her bed. Talked to her about it. Things got returned.',
    whyBad: 'Residents not clearly identified appropriately. No clinical context. No staff intervention method described. No therapeutic framing. No mention of outcome for both residents. Not documentable for incident review.',
    followup: [
      'How do you protect resident confidentiality when documenting a peer theft incident?',
      'Why is it important to document that no physical altercation occurred?',
      'What clinical diagnoses might contribute to stealing behavior in this population?',
      'What would be your next step if Resident A denied taking the items and they were never found?',
      'How should this incident be reported beyond the shift note?'
    ],
    advanced: 'Ask the employee to write the documentation for Resident B\'s experience of this incident separately — capturing her emotional response and staff support provided to her.'
  },
  {
    id: 5,
    tag: 'Scenario 5',
    title: 'Running Away Threats',
    content: `
      <p>At approximately <strong>5:15 PM</strong>, following a disagreement about weekend privileges, resident became verbally escalated and stated "I'm running away. I'm done with this place. You can't stop me."</p>
      <p>Resident moved toward the front door. Staff positioned themselves calmly near the exit, did not physically block resident, and used verbal de-escalation to encourage resident to remain in the home and discuss the issue.</p>
      <p>Staff reminded resident of her safety plan, asked her to identify a trusted support person she could speak with, and offered to call her therapist. Resident paused near the door, became tearful, and stated she "just wanted to be heard."</p>
      <p>Staff provided empathetic listening for approximately 15 minutes. Resident returned to common area and agreed to process the privilege dispute in her next therapy session. Resident remained at the facility for the remainder of the shift with no further elopement threats.</p>`,
    task: 'Document the threat, safety response, de-escalation, outcome, and safety considerations.',
    acceptable: 'At approximately 5:15 PM, following a disagreement regarding weekend privileges, resident became verbally escalated and verbalized intent to elope, stating she was "done with this place" and moving toward the facility\'s front exit. Staff responded by positioning calmly near the exit without physical restraint, engaging resident in verbal de-escalation. Staff referenced resident\'s individualized safety plan, encouraged identification of a trusted support individual, and offered to facilitate contact with resident\'s assigned therapist. Resident paused at exit, became tearful, and verbalized that she felt unheard. Staff provided empathetic, active listening for approximately 15 minutes. Resident agreed to return to common area and to process the privilege-related concern during her next scheduled therapy session. Resident remained at the facility for the duration of the shift without further elopement threats or behavioral incidents. Safety monitoring continued per protocol. Continued clinical support indicated for emotional regulation, frustration tolerance, and appropriate communication of needs.',
    unacceptable: 'Resident said she was going to run away. Staff talked her out of it. She stayed and was okay.',
    whyBad: 'No time documented. No safety response described. No specific de-escalation techniques noted. Safety plan not referenced. No clinical or treatment connection made. Insufficient for incident documentation.',
    followup: [
      'Why must you document the specific words a resident uses when making elopement threats?',
      'What is the difference between "blocking" and "positioning" in your documentation?',
      'When does an elopement threat require an immediate supervisor notification?',
      'How does referencing the resident\'s safety plan protect both the resident and the staff?',
      'What additional forms or reports might be required following an elopement threat?'
    ],
    advanced: 'Ask the employee how the documentation would change if the resident had successfully exited the building briefly before returning voluntarily.'
  },
  {
    id: 6,
    tag: 'Scenario 6',
    title: 'Staff Shift Manipulation',
    content: `
      <p>During evening shift, resident approached staff and stated that the morning shift staff had told her she could have extra phone time "as a reward." Staff had no record of this agreement and it was not documented in the shift log.</p>
      <p>Resident became frustrated when staff declined to honor the alleged agreement. Resident stated "You never believe me. Everyone says different things here." Resident then told the evening supervisor that daytime staff had "been mean to her all day."</p>
      <p>Staff documented the verbal report, reviewed the shift log and found no documentation of any phone reward agreement, and contacted the morning supervisor to verify. Morning supervisor confirmed no such agreement had been made.</p>
      <p>Staff addressed the behavior calmly with resident, noting the importance of accurate communication and consistency. Resident was reminded of the process for requesting privilege modifications. Resident became calm and participated in evening routine without further incident.</p>`,
    task: 'Document the incident, your verification steps, the clinical approach, and the outcome without being judgmental.',
    acceptable: 'During evening shift, resident approached staff and stated that daytime staff had verbally agreed to grant additional phone time as a behavioral reward. Staff reviewed the shift log and found no documentation of any such agreement. Staff contacted morning shift supervisor to verify the claim; morning supervisor confirmed that no phone reward agreement had been established. Staff communicated findings to resident in a non-confrontational manner. Resident became verbally frustrated, stating that staff were inconsistent and did not believe her. Staff validated resident\'s frustration while reinforcing the importance of documented agreements and consistent communication across shifts. Resident was educated on the facility\'s process for requesting privilege modifications through appropriate clinical channels. Resident became cooperative and completed evening routine without further behavioral concerns. Incident documented for clinical team awareness. Continued support recommended regarding honesty, consistent communication, and appropriate problem-solving strategies.',
    unacceptable: 'Resident tried to manipulate staff for extra phone time. She lied about what the morning staff said. We corrected her.',
    whyBad: 'Language is judgmental and accusatory. The word "lied" and "manipulate" are conclusions, not observations. This type of language can be harmful to the resident\'s clinical record and is not appropriate professional documentation.',
    followup: [
      'Why is the word "manipulation" problematic in professional documentation?',
      'How do you document unverified claims a resident makes without making judgments?',
      'What does this scenario teach about the importance of shift log documentation?',
      'How should this be communicated at the next clinical team meeting?',
      'What can this facility do systemically to reduce miscommunication across shifts?'
    ],
    advanced: 'Ask the employee to rewrite their note removing all judgmental language and replacing it with objective, observable descriptions of resident statements and behaviors.'
  },
  {
    id: 7,
    tag: 'Scenario 7',
    title: 'Bedtime Defiance',
    content: `
      <p>At <strong>9:30 PM</strong>, staff announced bedtime for all residents. Resident complied with hygiene but refused to go to her bedroom, stating she "wasn't tired" and demanding to stay up later.</p>
      <p>Staff explained the structured schedule and offered a 10-minute wind-down in the common area with quiet activity. Resident became argumentative, raising her voice and waking another resident who had already gone to bed.</p>
      <p>Staff redirected resident to her room, implemented structured limit-setting, and informed resident that continued refusal would result in privilege review the following day per facility policy. Resident verbalized displeasure but went to her room at approximately 9:55 PM.</p>
      <p>Resident did not attempt to leave her room after staff's final check at 10:10 PM. No further behavioral incidents were noted during the shift.</p>`,
    task: 'Document the refusal timeline, behavioral escalation, limit-setting used, and final outcome.',
    acceptable: 'At 9:30 PM, staff announced the facility\'s scheduled bedtime for all residents. Resident completed hygiene routine as directed but refused to proceed to her bedroom, stating she was not tired and requesting to remain in the common area. Staff offered a structured 10-minute wind-down period with quiet activity as a transition support. Resident became verbally argumentative and raised her voice, which disrupted another resident who had already retired for the evening. Staff redirected resident to her assigned bedroom and implemented structured limit-setting, informing resident that continued non-compliance with bedtime routine would result in privilege review the following day in accordance with facility policy. Resident verbalized ongoing displeasure but transitioned to her bedroom at approximately 9:55 PM. Staff conducted final room check at 10:10 PM; resident was in her room and no further behavioral incidents were noted during shift. Continued support indicated for compliance with structured routines, sleep hygiene, and appropriate response to staff limit-setting.',
    unacceptable: 'Resident didn\'t want to go to bed. She was loud and woke another resident. We told her she had to go to bed or lose privileges. She went. No more problems.',
    whyBad: 'No specific times documented. No clinical interventions named. No structured limit-setting language used. No treatment connection made. Does not capture impact on other residents adequately.',
    followup: [
      'Why does the time of compliance matter in bedtime defiance documentation?',
      'How does documenting impact on other residents support incident reporting?',
      'What is the clinical purpose of structured limit-setting versus punishment?',
      'How does this note change if the resident has a diagnosed sleep disorder?',
      'What follow-up should occur the next morning regarding this incident?'
    ],
    advanced: 'Ask the employee to write a brief note for the second resident who was disturbed, capturing any behavioral or emotional response that resulted from the disruption.'
  },
  {
    id: 8,
    tag: 'Scenario 8',
    title: 'Peer Bullying',
    content: `
      <p>During lunch at approximately <strong>12:15 PM</strong>, staff observed Resident A making repeated derogatory comments toward Resident B regarding her appearance. Comments included remarks about Resident B's weight and clothing. Resident B appeared tearful and moved away from the table.</p>
      <p>Staff immediately intervened, separating both residents. Resident A was escorted to the office, where staff addressed the behavior directly, identifying the comments as bullying and reviewing the facility's peer respect policy.</p>
      <p>Staff checked in with Resident B separately, who reported feeling "embarrassed and hurt." Staff provided emotional support and offered for Resident B to speak with her therapist. Resident B declined a therapist call but accepted staff support and returned to programming after approximately 20 minutes.</p>
      <p>Resident A was cooperative during the office meeting, acknowledged the comments were inappropriate, and agreed to apologize to Resident B. Both residents were monitored for the remainder of the shift with no further incidents.</p>`,
    task: 'Document both residents\' experiences, staff interventions for each, and monitoring outcome.',
    acceptable: 'At approximately 12:15 PM during scheduled lunch, staff observed Resident A making repeated derogatory comments toward Resident B, specifically regarding Resident B\'s physical appearance, including weight and clothing. Resident B presented as tearful and physically moved away from the dining area. Staff immediately intervened and separated both residents. Resident A was escorted to the office, where staff addressed the behavior as consistent with peer bullying, reviewed the facility\'s peer respect and behavioral expectations policy, and processed the impact of the comments with Resident A. Resident A was cooperative, acknowledged the comments were inappropriate, and agreed to offer a verbal apology to Resident B. Separately, staff checked in with Resident B, who reported feeling embarrassed and emotionally hurt by the comments. Staff provided emotional support and offered access to Resident B\'s assigned therapist. Resident B declined the therapist call but accepted staff support and returned to scheduled programming after approximately 20 minutes. Both residents were monitored for the remainder of the shift with no further peer conflict noted. Continued clinical support indicated for Resident A in areas of empathy, appropriate peer communication, and impulse control. Continued support for Resident B regarding peer conflict management and self-esteem.',
    unacceptable: 'Resident A was being mean to Resident B at lunch. Staff separated them and talked to Resident A. Resident B was upset but got over it.',
    whyBad: 'No specific content of comments documented. Both residents not clearly identified. No specific interventions for each resident described. Phrase "got over it" is dismissive and clinically inappropriate.',
    followup: [
      'Why must you document the specific content of bullying comments in the clinical note?',
      'How do you balance documenting the incident while protecting both residents\' dignity?',
      'What additional documentation is required when one resident observes another being bullied?',
      'Should the apology Resident A gave be documented? Why?',
      'How does this incident connect to each resident\'s individual treatment plan goals?'
    ],
    advanced: 'Ask the employee to identify which diagnoses common in Level III settings may contribute to bullying behavior and how that changes the clinical framing of the note.'
  },
  {
    id: 9,
    tag: 'Scenario 9',
    title: 'Panic Attack',
    content: `
      <p>At approximately <strong>6:45 PM</strong>, resident suddenly began experiencing rapid breathing, clutching her chest, and tearfulness without an identified trigger. Resident was unable to verbalize clearly, shaking visibly and stating "I can't breathe" and "Something is wrong with me."</p>
      <p>Staff immediately responded, guided resident to a quiet area away from other residents, and initiated grounding techniques per resident's established coping plan. Staff maintained calm verbal reassurance, encouraged slow breathing, and remained physically present with resident.</p>
      <p>After approximately 12 minutes, resident's breathing slowed and she became more communicative. Resident reported she had been thinking about an upcoming court date and "panicked." Staff validated resident's concerns and processed the anxiety trigger collaboratively.</p>
      <p>Staff notified supervisor and documented the episode. Resident was monitored for the remainder of the shift. No medical intervention was required. Resident's therapist was notified per protocol.</p>`,
    task: 'Document the physical presentation, safety response, de-escalation, trigger identification, and clinical follow-up.',
    acceptable: 'At approximately 6:45 PM, resident presented with acute onset of respiratory distress, including rapid breathing, visible trembling, and tearfulness without an immediately identified trigger. Resident verbalized inability to breathe and expressed fear that something was physically wrong. Staff immediately responded by guiding resident to a designated quiet area, away from other residents, to minimize environmental stimulation. Staff initiated grounding and coping strategies consistent with resident\'s established individualized coping plan, providing calm, sustained verbal reassurance and modeling slow, controlled breathing. After approximately 12 minutes, resident\'s respiratory rate visibly decreased and resident became communicative. Resident identified the trigger as anticipatory anxiety related to an upcoming court date. Staff validated resident\'s emotional experience, processed the identified anxiety trigger, and reinforced available coping strategies. Shift supervisor was notified of the episode. No medical intervention was required. Resident\'s assigned therapist was notified per facility protocol. Resident was closely monitored for the remainder of the shift without recurrence. Continued clinical support indicated for anxiety management, grounding techniques, and processing of identified legal stressor.',
    unacceptable: 'Resident had a panic attack. Staff calmed her down. She said she was scared about court. Therapist was called.',
    whyBad: 'No physical symptoms documented. No specific interventions described. No coping plan referenced. "Panic attack" is a clinical diagnosis — describe the observable symptoms instead. Critical physical and timeline details missing.',
    followup: [
      'Why should you avoid writing "panic attack" in a shift note and instead describe what you observed?',
      'At what point during a panic episode should you call 911 versus manage in-house?',
      'Why is identifying the trigger clinically important for treatment planning?',
      'What does "grounding techniques" mean, and should you be more specific?',
      'How does your documentation change if the episode lasted more than 30 minutes?'
    ],
    advanced: 'Ask the employee to document this same scenario as if the resident had a trauma history involving medical procedures — how would the clinical framing and intervention selection need to adapt?'
  },
  {
    id: 10,
    tag: 'Scenario 10',
    title: 'Family Call Meltdown',
    content: `
      <p>At <strong>7:00 PM</strong>, resident participated in a scheduled phone call with her biological mother. The call lasted approximately 8 minutes before resident abruptly ended it.</p>
      <p>Immediately following the call, resident began crying loudly, threw her phone across the room, and yelled "She doesn't care about me. She never did." Resident retreated to her bedroom and refused to engage with staff for approximately 20 minutes.</p>
      <p>Staff maintained close monitoring, checked in through the bedroom door every 5 minutes, and verbally offered support without pressuring resident to engage. After 20 minutes, resident opened her door and allowed staff to enter.</p>
      <p>Resident disclosed that her mother had told her she would not be attending the upcoming family visit. Staff provided empathetic support, validated resident's grief response, and explored appropriate coping strategies with resident. Resident eventually calmed, completed hygiene, and went to bed at 10:00 PM.</p>
      <p>Staff notified supervisor and documented for clinical team review and therapist notification.</p>`,
    task: 'Document the timeline, behavioral presentation, safety monitoring, emotional support, disclosure, and clinical follow-up.',
    acceptable: 'At 7:00 PM, resident participated in a scheduled phone call with her biological mother. The call concluded abruptly after approximately 8 minutes, following which resident presented with significant emotional distress. Resident was observed crying loudly, throwing her cellular phone across the room, and vocalizing feelings of rejection, stating her mother did not care about her. Resident retreated to her bedroom and initially refused to engage with staff. Staff maintained close safety monitoring, conducting wellness checks every five minutes via verbal check-in through the closed bedroom door without applying pressure for immediate engagement. After approximately 20 minutes, resident voluntarily opened her door and permitted staff entry. Resident disclosed that her mother had informed her she would not be attending the scheduled upcoming family visit. Staff provided empathetic, non-judgmental support, validated resident\'s grief and abandonment response, and collaboratively explored appropriate coping strategies. Resident\'s emotional presentation gradually stabilized. Resident completed hygiene routine and retired to her room at 10:00 PM without further behavioral incidents. Shift supervisor was notified. Incident documented for clinical team review and therapist notification per protocol. Continued therapeutic support indicated for grief processing, family relationship dynamics, abandonment schema, and emotional regulation.',
    unacceptable: 'Resident had a bad call with her mom. She got upset and threw her phone. She eventually calmed down and went to sleep.',
    whyBad: 'No timeline. No specific behaviors described objectively. No monitoring protocol documented. No disclosure content captured appropriately. No clinical connection to treatment needs. Not sufficient for therapist review.',
    followup: [
      'Why is the timeline of this incident clinically important?',
      'How do you document what a resident discloses during an emotional episode without violating confidentiality?',
      'What is the clinical term for the abandonment response this resident displayed?',
      'When does emotional dysregulation following a family call require a safety assessment?',
      'How would this note be communicated to the therapist before the next session?'
    ],
    advanced: 'Ask the employee how documentation would change if the mother had made an inappropriate statement on the call — what additional reporting obligations might apply?'
  },
  {
    id: 11,
    tag: 'Scenario 11',
    title: 'Excellent Progress Day',
    content: `
      <p>Throughout the shift, resident demonstrated exceptional emotional regulation and positive social engagement. Resident greeted peers and staff with a positive attitude upon waking, completed all morning routines independently and on time, and offered to help a peer with a task without being prompted.</p>
      <p>During afternoon programming, resident participated actively in group discussion, contributed appropriate and insightful comments, and used humor constructively to build peer connection.</p>
      <p>Resident received corrective feedback from staff regarding a minor rule reminder and responded without defensiveness, stating "I understand, I'll do better." This represented a notable departure from previous patterns of defensive responding.</p>
      <p>Resident went to bed on time, completed all hygiene independently, and expressed gratitude to evening staff. No behavioral concerns were noted during the shift.</p>`,
    task: 'Document positive progress as thoroughly as a difficult shift — capturing specific behaviors, growth areas, and treatment relevance.',
    acceptable: 'Resident demonstrated notably positive behavioral presentation throughout the shift consistent with treatment progress. Resident greeted peers and staff warmly upon waking and completed all morning hygiene and routine tasks independently and within scheduled timeframe without staff prompting. During afternoon programming, resident participated actively in group discussion, demonstrated appropriate social skills, and utilized constructive humor to engage peers. Resident proactively offered assistance to a peer without staff direction, reflecting emerging prosocial behavior. When staff provided corrective feedback regarding a minor facility rule, resident responded without defensiveness, verbally acknowledging the feedback and expressing intent to improve. This response represents a marked improvement from previously documented patterns of defensive and argumentative responses to staff redirection. Resident completed evening hygiene routine independently, transitioned to bed on schedule, and expressed unsolicited appreciation to evening staff. No behavioral concerns were noted during the shift. Progress documented for treatment team review. Positive reinforcement provided verbally throughout the shift. Continued support recommended to sustain and generalize current emotional regulation gains across settings.',
    unacceptable: 'Good day. Resident was on her best behavior. No issues.',
    whyBad: 'Positive days require the same clinical detail as difficult ones. Vague language provides no evidence of progress, cannot support treatment plan goal achievement, and fails to document the specific behaviors that demonstrate growth.',
    followup: [
      'Why is thorough documentation of a positive day as important as a behavioral incident?',
      'How does this note support the resident\'s discharge planning?',
      'What specific behaviors in this scenario represent measurable treatment progress?',
      'How do you document positive reinforcement you provided during the shift?',
      'What would you highlight from this note in the next clinical team meeting?'
    ],
    advanced: 'Ask the employee to identify which specific treatment plan goals were demonstrated today and how this documentation could be used as evidence of clinical progress in a Level of Care review.'
  }
];

/* ============================================================
   SCREEN MANAGEMENT
   ============================================================ */
const screens = {
  voice:    $v('voice-screen'),
  intro:    $v('intro-screen'),
  scenario: $v('scenario-screen'),
  followup: $v('followup-screen'),
  ack:      $v('ack-screen'),
  complete: $v('complete-screen')
};
function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => {
    if (el) el.classList.toggle('active', k === name);
  });
  window.scrollTo(0, 0);
}

/* ============================================================
   VOICE SELECTION
   ============================================================ */
(function initVoiceScreen() {
  const chooseAlex  = $v('chooseAlex');
  const chooseSarah = $v('chooseSarah');
  const startBtn    = $v('start-btn');
  const hintEl      = $v('voice-hint');
  const resumeBanner= $v('resume-banner');
  const resumeDetail= $v('resume-detail');
  const resumeBtn   = $v('resume-btn');
  const freshBtn    = $v('start-fresh-btn');

  const saved = safeGet();
  if (saved && saved.scenario !== undefined) {
    resumeBanner.style.display = 'block';
    resumeDetail.textContent = `You left off at Scenario ${saved.scenario + 1} of ${TOTAL_SCENARIOS}`;
  }

  function selectVoice(v) {
    selectedVoice = v;
    chooseAlex.classList.toggle('selected',  v === 'alex');
    chooseSarah.classList.toggle('selected', v === 'sarah');
    startBtn.disabled = false;
    hintEl.textContent = v === 'alex' ? 'Alex will guide you through the training' : 'Sarah will guide you through the training';
  }

  chooseAlex.addEventListener('click',  () => selectVoice('alex'));
  chooseSarah.addEventListener('click', () => selectVoice('sarah'));

  startBtn.addEventListener('click', () => { if (!selectedVoice) return; startTraining(false); });

  resumeBtn && resumeBtn.addEventListener('click', () => {
    const s = safeGet();
    if (s && s.voice) selectedVoice = s.voice;
    if (!selectedVoice) selectedVoice = 'alex';
    startTraining(true);
  });

  freshBtn && freshBtn.addEventListener('click', () => {
    safeClear();
    resumeBanner.style.display = 'none';
  });
})();

/* ============================================================
   START TRAINING
   ============================================================ */
function startTraining(resume) {
  // Set instructor chips across all headers
  ['instructorChip','instructorChip2','instructorChip3'].forEach(id => {
    const el = $v(id);
    if (el) { el.textContent = selectedVoice === 'alex' ? '👤 Alex' : '👤 Sarah'; el.style.display = 'inline-flex'; }
  });
  [$v('saveBtn'), $v('saveBtn2')].forEach(b => { if (b) b.style.display = 'inline-flex'; });

  // Set audio
  const audio = $v('mainAudio');
  audio.src = selectedVoice === 'alex' ? 'narration_alex.mp3' : 'narration_sarah.mp3';
  audio.load();
  $v('audioLabel').textContent = selectedVoice === 'alex' ? 'Alex · Documentation Overview' : 'Sarah · Documentation Overview';

  if (resume) {
    const s = safeGet();
    if (s) {
      currentScenario = s.scenario || 0;
      scores          = s.scores   || new Array(TOTAL_SCENARIOS).fill(null);
      attempts        = s.attempts || new Array(TOTAL_SCENARIOS).fill(0);
    }
    showScreen('scenario');
    loadScenario(currentScenario);
  } else {
    showScreen('intro');
  }
}

/* ============================================================
   AUDIO PLAYER
   ============================================================ */
(function initAudio() {
  const audio       = $v('mainAudio');
  const playBtn     = $v('playBtn');
  const playIcon    = $v('play-icon');
  const pauseIcon   = $v('pause-icon');
  const progFill    = $v('progressFill');
  const progThumb   = $v('progressThumb');
  const progTrack   = $v('progressTrack');
  const audioTime   = $v('audioTime');

  playBtn.addEventListener('click', () => {
    audio.paused ? audio.play().catch(()=>{}) : audio.pause();
  });
  audio.addEventListener('play',  updatePP);
  audio.addEventListener('pause', updatePP);
  function updatePP() {
    const p = !audio.paused;
    playIcon.style.display  = p ? 'none'  : 'block';
    pauseIcon.style.display = p ? 'block' : 'none';
  }
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progFill.style.width  = pct + '%';
    progThumb.style.left  = pct + '%';
    audioTime.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });
  progTrack.addEventListener('click', e => {
    if (!audio.duration) return;
    const r = progTrack.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });
  function fmt(s) {
    s = Math.floor(s || 0);
    return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
  }
})();

/* Begin scenarios button */
$v('beginScenariosBtn').addEventListener('click', () => {
  const introAudio = $v('mainAudio');
  const currentTime = introAudio.currentTime;
  // Transfer playback state to scenario audio
  introAudio.pause();
  showScreen('scenario');
  loadScenario(0);
  // Carry over the audio position so scenario player continues from same point
  const sa = $v('scenarioAudio');
  if (sa && currentTime > 0) {
    sa.addEventListener('loadedmetadata', () => {
      sa.currentTime = currentTime;
    }, { once: true });
  }
});

/* ============================================================
   SCENARIO AUDIO PLAYER (sticky bar on scenario screen)
   ============================================================ */
(function initScenarioAudio() {
  const playBtn2    = $v('playBtn2');
  const playIcon2   = $v('play-icon2');
  const pauseIcon2  = $v('pause-icon2');
  const progFill2   = $v('progressFill2');
  const progThumb2  = $v('progressThumb2');
  const progTrack2  = $v('progressTrack2');
  const audioTime2  = $v('audioTime2');
  const syncBadge   = $v('autoSyncBadge');

  // We reuse mainAudio element but mirror controls to scenario bar
  const audio = $v('mainAudio');

  if (!playBtn2 || !audio) return; // guard: elements not in DOM yet

  playBtn2.addEventListener('click', () => {
    audio.paused ? audio.play().catch(()=>{}) : audio.pause();
  });

  audio.addEventListener('play',  () => {
    playIcon2.style.display  = 'none';
    pauseIcon2.style.display = 'block';
  });
  audio.addEventListener('pause', () => {
    playIcon2.style.display  = 'block';
    pauseIcon2.style.display = 'none';
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progFill2.style.width  = pct + '%';
    progThumb2.style.left  = pct + '%';
    audioTime2.textContent = fmt2(audio.currentTime) + ' / ' + fmt2(audio.duration);

    // Auto-advance scenario based on timestamp
    if (!autoSyncEnabled) return;
    const ts = selectedVoice === 'alex' ? ALEX_SCENARIO_TS : SARAH_SCENARIO_TS;
    let targetScenario = currentScenario;
    for (let i = ts.length - 1; i >= 0; i--) {
      if (audio.currentTime >= ts[i]) { targetScenario = i; break; }
    }
    if (targetScenario !== currentScenario && targetScenario > currentScenario) {
      // Only auto-advance forward, never back
      loadScenario(targetScenario);
      syncBadge.classList.add('synced');
      setTimeout(() => syncBadge.classList.remove('synced'), 1500);
    }
  });

  progTrack2.addEventListener('click', e => {
    if (!audio.duration) return;
    const r = progTrack2.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    autoSyncEnabled = true;
  });

  function fmt2(s) {
    s = Math.floor(s || 0);
    return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
  }
})();

/* ============================================================
   SAVE PROGRESS
   ============================================================ */
function doSave() {
  safeSet({ voice: selectedVoice, scenario: currentScenario, scores, attempts });
  return true;
}
[$v('saveBtn'), $v('saveBtn2')].forEach(btn => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    doSave();
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Saved';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
});

/* ============================================================
   SCENARIO ENGINE
   ============================================================ */
function goToPrevScenario() {
  if (currentScenario > 0) {
    autoSyncEnabled = false; // disable auto-sync when navigating manually
    loadScenario(currentScenario - 1);
  }
}

function loadScenario(idx) {
  currentScenario = idx;
  const sc = SCENARIOS[idx];

  // Progress bar
  $v('scenarioProgressFill').style.width = ((idx / TOTAL_SCENARIOS) * 100) + '%';
  $v('scenarioProgressLabel').textContent = `Scenario ${idx + 1} of ${TOTAL_SCENARIOS}`;

  // Card
  $v('scenarioTag').textContent     = sc.tag;
  $v('scenarioTitle').textContent   = sc.title;
  $v('scenarioContent').innerHTML   = sc.content;

  // Reset writing area
  $v('noteInput').value      = '';
  $v('wordCount').textContent = '0 words';

  // Hide feedback and post-grade actions
  $v('feedbackArea').style.display     = 'none';
  $v('postGradeActions').style.display = 'none';
  $v('scenarioActions').style.display  = 'flex';
  $v('exampleArea').style.display      = 'none';
  $v('showExampleBtn').textContent     = 'Show Example Answer';

  // Update Prev buttons state
  const prevBtn     = $v('prevScenarioBtn');
  const prevBtnPost = $v('prevScenarioBtnPost');
  if (prevBtn)     prevBtn.disabled     = idx === 0;
  if (prevBtnPost) prevBtnPost.disabled = idx === 0;

  // Next button label
  const nextBtn = $v('nextScenarioBtn');
  nextBtn.textContent = idx === TOTAL_SCENARIOS - 1 ? 'Finish Training →' : 'Next Scenario →';

  // Reset scenario read button state when navigating to a new scenario
  stopScenarioRead();
}

/* ============================================================
   SCENARIO READ BUTTON
   Plays per-scenario audio (alex_sN.mp3 / sarah_sN.mp3)
   with an inline mini-progress bar on the card.
   ============================================================ */
(function initScenarioReadBtn() {
  const readBtn      = $v('scenarioReadBtn');
  const readLabel    = $v('scenarioReadLabel');
  const readIcon     = $v('scenarioReadIcon');
  const stopIcon     = $v('scenarioStopIcon');
  const readBar      = $v('scenarioReadBar');
  const readProgress = $v('scenarioReadProgress');
  const audio        = $v('scenarioReadAudio');

  if (!readBtn || !audio) return;

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    readProgress.style.width = pct + '%';
  });

  audio.addEventListener('ended', () => {
    stopScenarioRead();
  });

  readBtn.addEventListener('click', () => {
    if (!audio.paused) {
      // currently playing — pause it
      audio.pause();
      readBtn.classList.remove('playing');
      readIcon.style.display = 'block';
      stopIcon.style.display = 'none';
      readLabel.textContent  = 'Read Scenario';
    } else {
      // start / resume
      const voice = selectedVoice === 'sarah' ? 'sarah' : 'alex';
      const idx   = currentScenario + 1; // files named alex_s1.mp3 … alex_s11.mp3
      const src   = `scenario-audio/${voice}_s${idx}.mp3`;
      if (audio.getAttribute('data-src') !== src) {
        audio.src = src;
        audio.setAttribute('data-src', src);
        readProgress.style.width = '0%';
      }
      readBar.style.display = 'block';
      audio.play().catch(() => {});
      readBtn.classList.add('playing');
      readIcon.style.display = 'none';
      stopIcon.style.display = 'block';
      readLabel.textContent  = 'Pause';
    }
  });
})();

function stopScenarioRead() {
  const audio        = $v('scenarioReadAudio');
  const readBtn      = $v('scenarioReadBtn');
  const readLabel    = $v('scenarioReadLabel');
  const readIcon     = $v('scenarioReadIcon');
  const stopIcon     = $v('scenarioStopIcon');
  const readBar      = $v('scenarioReadBar');
  const readProgress = $v('scenarioReadProgress');
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.removeAttribute('data-src');
  if (readBtn) {
    readBtn.classList.remove('playing');
    readIcon.style.display = 'block';
    stopIcon.style.display = 'none';
    readLabel.textContent  = 'Read Scenario';
  }
  if (readBar)      readBar.style.display      = 'none';
  if (readProgress) readProgress.style.width   = '0%';
}

/* Word counter */
$v('noteInput').addEventListener('input', () => {
  const words = $v('noteInput').value.trim().split(/\s+/).filter(w => w).length;
  $v('wordCount').textContent = words + ' word' + (words !== 1 ? 's' : '');
});

/* Submit for grading */
$v('submitNoteBtn').addEventListener('click', () => {
  const note = $v('noteInput').value.trim();
  if (!note || note.split(/\s+/).filter(w=>w).length < 20) {
    $v('noteInput').style.borderColor = 'var(--color-error)';
    setTimeout(() => { $v('noteInput').style.borderColor = ''; }, 2000);
    return;
  }
  gradeNote(note, currentScenario);
});

/* Prev buttons */
$v('prevScenarioBtn').addEventListener('click', goToPrevScenario);
$v('prevScenarioBtnPost').addEventListener('click', goToPrevScenario);

/* Revise & resubmit */
$v('reviseBtn').addEventListener('click', () => {
  $v('feedbackArea').style.display    = 'none';
  $v('postGradeActions').style.display = 'none';
  $v('scenarioActions').style.display  = 'flex';
  $v('noteInput').focus();
});

/* Show example toggle */
$v('showExampleBtn').addEventListener('click', () => {
  const area = $v('exampleArea');
  const btn  = $v('showExampleBtn');
  if (area.style.display === 'none') {
    const sc = SCENARIOS[currentScenario];
    $v('exampleAcceptable').textContent   = sc.acceptable;
    $v('exampleUnacceptable').textContent = sc.unacceptable;
    $v('exampleWhy').textContent          = 'Why this is unacceptable: ' + sc.whyBad;
    area.style.display = 'block';
    btn.textContent    = 'Hide Example';
  } else {
    area.style.display = 'none';
    btn.textContent    = 'Show Example Answer';
  }
});

/* Next scenario */
$v('nextScenarioBtn').addEventListener('click', () => {
  autoSyncEnabled = true; // re-enable sync when moving forward
  if (currentScenario < TOTAL_SCENARIOS - 1) {
    showFollowup(currentScenario);
  } else {
    showScreen('ack');
    initAck();
  }
});

/* ============================================================
   AI-STYLE GRADING ENGINE
   Uses keyword/phrase pattern matching across all 5 rubric categories.
   Returns detailed per-category scores + written feedback.
   ============================================================ */
function gradeNote(note, scenarioIdx) {
  attempts[scenarioIdx]++;
  const sc  = SCENARIOS[scenarioIdx];
  const n   = note.toLowerCase();
  const words = n.split(/\s+/).filter(w => w);
  const wc  = words.length;

  // ── 1. Behavior description (0-2)
  const behaviorKws = [
    'crying','tearful','upset','agitated','yelling','screaming','throwing','slammed',
    'refused','denied','verbalized','stated','reported','observed','presented','appeared',
    'retreated','escalated','confrontational','raised voice','loud','disruptive',
    'breathing','trembling','shaking','tearfulness','rapid breathing','chest',
    'threatening','elope','elopement','defiant','non-compliant','stomped','walked away',
    'derogatory','comments','bullying','stealing','took','removed','retrieved',
    'returned from school','upon arrival','upon waking','during','at approximately','pm','am',
    'physically','verbally','behavioral','presentation'
  ];
  const behaviorHits = behaviorKws.filter(kw => n.includes(kw)).length;
  const behaviorScore = behaviorHits >= 5 ? 2 : behaviorHits >= 2 ? 1 : 0;

  // ── 2. Staff interventions (0-2)
  const interventionKws = [
    'staff','staff approached','staff maintained','staff intervened','staff redirected',
    'de-escalation','de-escalated','redirected','limit-setting','limit setting',
    'coping skills','coping strategies','coping plan','grounding','breathing','safety plan',
    'separated','escorted','monitored','monitoring','provided support','provided empathetic',
    'validated','addressed','processed','praised','encouraged','prompted','offered',
    'contacted supervisor','notified supervisor','notified therapist','documented',
    'positioned','calm approach','calm tone','verbal reassurance','empathetic listening',
    'wellness check','room check','therapeutic','policy','facility protocol',
    'choice','structured choice','wind-down','transition'
  ];
  const interventionHits = interventionKws.filter(kw => n.includes(kw)).length;
  const interventionScore = interventionHits >= 5 ? 2 : interventionHits >= 2 ? 1 : 0;

  // ── 3. Resident response to interventions (0-2)
  const responseKws = [
    'resident became','resident responded','resident returned','resident agreed','resident accepted',
    'resident complied','resident calmed','resident stabilized','resident receptive',
    'resident denied','resident refused','resident became cooperative','resident became tearful',
    'resident verbalized','resident disclosed','resident reported','resident stated',
    'resident opened','resident allowed','resident completed','resident participated',
    'resident surrendered','resident acknowledged','after approximately','after several',
    'eventually','gradually','within','minutes later','became communicative','became calm',
    'returned to','completed hygiene','ate dinner','went to bed','participated in'
  ];
  const responseHits = responseKws.filter(kw => n.includes(kw)).length;
  const responseScore = responseHits >= 4 ? 2 : responseHits >= 2 ? 1 : 0;

  // ── 4. Professional / objective language (0-2)
  // Penalize vague/subjective words, reward clinical terms
  const badWords = ['lied','lying','manipulative','manipulate','bad behavior','acting out',
    'threw a fit','meltdown','crazy','mad','fine','okay','good','got over it',
    'was upset','calmed down eventually','she\'s difficult','always does this'];
  const goodTerms = ['behavioral','clinical','therapeutic','treatment','protocol','policy',
    'approximately','facility','intervention','de-escalat','documented','monitoring',
    'presentation','schedule','routine','individualized','verbalized','observed',
    'objective','appropriate','compliance','continued support','indicated','recommended',
    'no further','no physical','per protocol','per facility','without incident'];
  const badHits  = badWords.filter(bw => n.includes(bw)).length;
  const goodHits = goodTerms.filter(gw => n.includes(gw)).length;
  let langScore = 0;
  if (badHits === 0 && goodHits >= 5) langScore = 2;
  else if (badHits <= 1 && goodHits >= 3) langScore = 1;

  // ── 5. Progress / continued needs (0-2)
  const progressKws = [
    'continued support','continued clinical','continued therapeutic','ongoing support',
    'treatment plan','treatment needs','continued need','indicated for','recommended for',
    'progress noted','represents progress','marked improvement','treatment goal',
    'clinical support','further support','frustration tolerance','emotional regulation',
    'peer conflict','impulse control','compliance','sleep hygiene','anxiety management',
    'grief','abandonment','honesty','boundaries','coping','self-esteem','discharge',
    'level of care','clinical team','therapist','supervisor notified','notified per protocol'
  ];
  const progressHits = progressKws.filter(kw => n.includes(kw)).length;
  const progressScore = progressHits >= 3 ? 2 : progressHits >= 1 ? 1 : 0;

  // Length bonus/penalty
  let bonus = 0;
  if (wc >= 80) bonus = 1;

  const rawScore = behaviorScore + interventionScore + responseScore + langScore + progressScore;
  const finalScore = Math.min(10, rawScore + bonus);

  // Store score (keep highest)
  if (scores[scenarioIdx] === null || finalScore > scores[scenarioIdx]) {
    scores[scenarioIdx] = finalScore;
  }
  gradedNote = note;
  doSave();

  displayFeedback(finalScore, behaviorScore, interventionScore, responseScore, langScore, progressScore, badWords.filter(bw => n.includes(bw)));
}

function displayFeedback(total, b, i, r, l, p, flaggedWords) {
  $v('scenarioActions').style.display  = 'none';
  $v('feedbackArea').style.display     = 'block';
  $v('postGradeActions').style.display = 'flex';

  const passed = total >= PASS_SCORE;

  // Score circle
  const scoreEl = $v('scoreDisplay');
  scoreEl.textContent = total + '/10';
  scoreEl.className   = 'score-display ' + (total >= PASS_SCORE ? 'pass' : total >= 6 ? 'partial' : 'fail');

  $v('feedbackTitle').textContent = total >= PASS_SCORE
    ? '✅ Strong documentation — you passed this scenario!'
    : total >= 6
      ? '⚠️ Good effort — a few areas need strengthening to pass (8/10 required)'
      : '❌ This note needs significant improvement before it can pass';

  // Breakdown
  const cats = [
    { label: 'Behavior Description', score: b },
    { label: 'Staff Interventions',  score: i },
    { label: 'Resident Response',    score: r },
    { label: 'Professional Language',score: l },
    { label: 'Progress/Needs',       score: p }
  ];
  $v('feedbackBreakdown').innerHTML = cats.map(c => {
    const cls = c.score === 2 ? 'full' : c.score === 1 ? 'partial' : 'zero';
    return `<div class="rubric-score ${cls}">${c.label}: ${c.score}/2</div>`;
  }).join('');

  // Written feedback
  const tips = [];
  if (b < 2) tips.push('Add more specific behavioral descriptions — exact time, observable actions, and direct quotes when applicable.');
  if (i < 2) tips.push('Describe each staff intervention in clinical terms — name the technique (e.g., de-escalation, limit-setting, coping prompts) and what you specifically said or did.');
  if (r < 2) tips.push('Document how the resident responded to each intervention — resistance, partial compliance, progress, or full cooperation.');
  if (l < 2) {
    let msg = 'Use objective, clinical language throughout. ';
    if (flaggedWords.length) msg += `Avoid terms like: "${flaggedWords.join('", "')}" — describe behavior factually instead.`;
    tips.push(msg);
  }
  if (p < 2) tips.push('End your note with continued treatment needs or progress noted — connect the incident to the resident\'s clinical goals.');
  if (!tips.length) tips.push('Excellent work. Your note is thorough, objective, and clinically relevant.');

  $v('feedbackText').innerHTML = tips.map(t => `<p>• ${t}</p>`).join('');

  // Show revise button only if failed
  $v('reviseBtn').style.display = passed ? 'none' : 'inline-flex';
}

/* ============================================================
   FOLLOW-UP QUESTIONS
   ============================================================ */
function showFollowup(idx) {
  const sc = SCENARIOS[idx];
  $v('followupScenarioTitle').textContent = sc.title + ' — Follow-Up';
  $v('followupQuestions').innerHTML = sc.followup.map(q => `<li>${q}</li>`).join('');
  $v('advancedPromptText').textContent = sc.advanced;
  $v('continueFromFollowup').textContent = idx < TOTAL_SCENARIOS - 2
    ? 'Next Scenario →'
    : idx === TOTAL_SCENARIOS - 2 ? 'Final Scenario →' : 'Finish Training →';
  showScreen('followup');
}

$v('continueFromFollowup').addEventListener('click', () => {
  const next = currentScenario + 1;
  if (next < TOTAL_SCENARIOS) {
    showScreen('scenario');
    loadScenario(next);
  } else {
    showScreen('ack');
    initAck();
  }
});

/* ============================================================
   ACKNOWLEDGMENT
   ============================================================ */
function initAck() {
  const dateInput = $v('staffDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  initSigCanvas();
}

function initSigCanvas() {
  const canvas = $v('sigCanvas');
  if (!canvas || sigCtx) return;
  sigCtx = canvas.getContext('2d');
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    sigCtx.scale(dpr, dpr);
    sigCtx.strokeStyle = '#ffffff';
    sigCtx.lineWidth   = 2.5;
    sigCtx.lineCap     = 'round';
    sigCtx.lineJoin    = 'round';
    sigHasData = false;
  }
  resize();
  const pos = e => { const r = canvas.getBoundingClientRect(), s = e.touches ? e.touches[0] : e; return { x: s.clientX - r.left, y: s.clientY - r.top }; };
  canvas.addEventListener('mousedown',  e => { sigPainting = true;  const p = pos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); });
  canvas.addEventListener('mousemove',  e => { if (!sigPainting) return; const p = pos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); sigHasData = true; });
  canvas.addEventListener('mouseup',    () => sigPainting = false);
  canvas.addEventListener('mouseleave', () => sigPainting = false);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); sigPainting = true;  const p = pos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!sigPainting) return; const p = pos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); sigHasData = true; }, { passive: false });
  canvas.addEventListener('touchend',   () => sigPainting = false);
  $v('clearSig').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    sigHasData = false;
  });
}

$v('ackForm').addEventListener('submit', e => {
  e.preventDefault();
  const name  = $v('staffName').value.trim();
  const title = $v('staffTitle').value.trim();
  const date  = $v('staffDate').value;
  const c1    = $v('ackCheck1').checked;
  const c2    = $v('ackCheck2').checked;
  const c3    = $v('ackCheck3').checked;

  $v('sigError').classList.add('hidden');
  $v('formError').classList.add('hidden');

  let valid = name && title && date && c1 && c2 && c3;
  if (!sigHasData) { $v('sigError').classList.remove('hidden'); valid = false; }
  if (!valid)      { $v('formError').classList.remove('hidden'); return; }

  const displayName = name + (title ? ', ' + title : '');
  $v('certName').textContent = displayName;
  const d = new Date(date + 'T12:00:00');
  const formattedDate = d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  $v('certDate').textContent  = 'Completed: ' + formattedDate;

  const avg = scores.filter(s => s !== null);
  const avgScore = avg.length ? Math.round(avg.reduce((a,b) => a+b, 0) / avg.length * 10) / 10 : 0;
  const scoreStr = `Average Score: ${avgScore}/10 across ${avg.length} scenario${avg.length !== 1 ? 's' : ''}`;
  $v('certScore').textContent = scoreStr;

  sendCertEmail({ staffName: name, staffTitle: title, compDate: formattedDate, quizScore: scoreStr, instructor: selectedVoice === 'alex' ? 'Alex' : 'Sarah' });
  safeClear();
  showScreen('complete');
});

/* ============================================================
   EMAIL
   ============================================================ */
function sendCertEmail(data) {
  if (EJS_PUBLIC === 'YOUR_EMAILJS_PUBLIC_KEY') { console.info('[SDRG] EmailJS not configured.'); return; }
  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EJS_SERVICE, template_id: EJS_TEMPLATE, user_id: EJS_PUBLIC,
      template_params: {
        to_email: ADMIN_EMAIL, staff_name: data.staffName, staff_title: data.staffTitle,
        comp_date: data.compDate, quiz_score: data.quizScore, instructor: data.instructor,
        facility: 'Sanni Day Residential Group — 1312 Lineberger Ave, Gastonia, NC 28052'
      }
    })
  }).then(r => { if (r.ok) console.info('[SDRG] Email sent.'); }).catch(() => {});
}

/* ============================================================
   PDF CERTIFICATE
   ============================================================ */
window.downloadCertPDF = async function() {
  const btn = $v('downloadCertBtn');
  if (btn) { btn.textContent = '⏳ Generating…'; btn.disabled = true; }
  try {
    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
    const staffName  = ($v('certName')  || {}).textContent || '—';
    const dateStr    = ($v('certDate')  || {}).textContent || '—';
    const scoreStr   = ($v('certScore') || {}).textContent || '—';
    const instructor = selectedVoice === 'alex' ? 'Alex' : 'Sarah';

    const doc  = await PDFDocument.create();
    doc.setTitle('Documentation Training Certificate — Sanni Day Residential Group');
    doc.setAuthor('Perplexity Computer');

    const page = doc.addPage([792, 612]);
    const W = page.getWidth(), H = page.getHeight();
    const fb = await doc.embedFont(StandardFonts.HelveticaBold);
    const fr = await doc.embedFont(StandardFonts.Helvetica);
    const fi = await doc.embedFont(StandardFonts.HelveticaOblique);

    const RED   = rgb(0.545, 0.102, 0.102);
    const GOLD  = rgb(0.957, 0.643, 0.290);
    const DARK  = rgb(0.102, 0.102, 0.102);
    const MID   = rgb(0.42,  0.42,  0.42);
    const LIGHT = rgb(0.88,  0.88,  0.88);
    const WHITE = rgb(1, 1, 1);
    const CREAM = rgb(0.969, 0.965, 0.949);

    page.drawRectangle({ x:0, y:0, width:W, height:H, color:CREAM });
    const M = 28;
    page.drawRectangle({ x:M, y:M, width:W-M*2, height:H-M*2, borderColor:RED, borderWidth:3, color:WHITE });
    const M2 = M+8;
    page.drawRectangle({ x:M2, y:M2, width:W-M2*2, height:H-M2*2, borderColor:GOLD, borderWidth:1, color:WHITE });

    const BW = 140;
    page.drawRectangle({ x:M, y:M, width:BW, height:H-M*2, color:RED });
    const bl = 'CERTIFICATE', bls = 11;
    const blw = fb.widthOfTextAtSize(bl, bls);
    page.drawText(bl, { x:M+BW/2-bls/2, y:H/2-blw/2, size:bls, font:fb, color:WHITE, rotate:degrees(90) });
    page.drawCircle({ x:M+BW/2, y:H-M-55, size:26, color:GOLD });
    const orgW2 = fb.widthOfTextAtSize('SDRG', 10);
    page.drawText('SDRG', { x:M+BW/2-orgW2/2, y:M+18, size:10, font:fb, color:GOLD });

    const CX = M+BW+30; let cy = H-M-40;
    const orgN = 'Sanni Day Residential Group';
    const orgNw = fb.widthOfTextAtSize(orgN, 11);
    page.drawText(orgN, { x:W-M-16-orgNw, y:cy, size:11, font:fb, color:RED }); cy -= 16;
    const addr = '1312 Lineberger Ave, Gastonia, NC 28052  •  Level 3 Residential Group Home';
    const addrW = fr.widthOfTextAtSize(addr, 8);
    page.drawText(addr, { x:W-M-16-addrW, y:cy, size:8, font:fr, color:MID }); cy -= 28;
    page.drawLine({ start:{x:CX,y:cy}, end:{x:W-M-16,y:cy}, thickness:1.5, color:GOLD }); cy -= 22;
    page.drawText('This certifies that', { x:CX, y:cy, size:11, font:fi, color:MID }); cy -= 38;
    const nfs = 28;
    page.drawText(staffName, { x:CX, y:cy, size:nfs, font:fb, color:DARK }); cy -= nfs+10;
    const CW = W-CX-M-20;
    const nw = Math.min(fb.widthOfTextAtSize(staffName, nfs), CW);
    page.drawLine({ start:{x:CX,y:cy}, end:{x:CX+nw,y:cy}, thickness:1, color:LIGHT }); cy -= 20;
    page.drawText('has successfully completed the', { x:CX, y:cy, size:11, font:fi, color:MID }); cy -= 26;
    page.drawText('Scenario-Based Documentation Training', { x:CX, y:cy, size:16, font:fb, color:RED }); cy -= 24;
    page.drawText('11 Scenarios Completed  •  Level III Residential Care', { x:CX, y:cy, size:9, font:fr, color:MID }); cy -= 22;
    page.drawText(scoreStr, { x:CX, y:cy, size:10, font:fr, color:MID }); cy -= 20;
    page.drawText(dateStr, { x:CX, y:cy, size:10, font:fr, color:MID });
    const iT = 'Instructor: ' + instructor, iW = fr.widthOfTextAtSize(iT, 10);
    page.drawText(iT, { x:W-M-16-iW, y:cy, size:10, font:fr, color:MID }); cy -= 36;
    page.drawLine({ start:{x:CX,y:cy}, end:{x:W-M-16,y:cy}, thickness:1, color:GOLD }); cy -= 28;
    page.drawLine({ start:{x:CX,y:cy}, end:{x:CX+200,y:cy}, thickness:1, color:DARK }); cy -= 14;
    page.drawText('Ashley K. Sanni', { x:CX, y:cy, size:10, font:fb, color:DARK }); cy -= 14;
    page.drawText('Director, Sanni Day Residential Group', { x:CX, y:cy, size:9, font:fr, color:MID });

    const sx = W-M-16-50, sy = M+35;
    page.drawCircle({ x:sx, y:sy, size:40, color:RED });
    page.drawCircle({ x:sx, y:sy, size:36, color:rgb(0.62,0.13,0.13) });
    const sT1 = 'TRAINING', sT2 = 'COMPLETE';
    page.drawText(sT1, { x:sx-fb.widthOfTextAtSize(sT1,7)/2, y:sy+5,  size:7, font:fb, color:WHITE });
    page.drawText(sT2, { x:sx-fb.widthOfTextAtSize(sT2,7)/2, y:sy-5,  size:7, font:fb, color:WHITE });
    page.drawText('✓',  { x:sx-5, y:sy+18, size:11, font:fb, color:GOLD });

    const bytes = await doc.save();
    const blob  = new Blob([bytes], { type:'application/pdf' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url;
    a.download = 'DocTraining_Certificate_' + (staffName.replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_') || 'Employee') + '.pdf';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 3000);
  } catch(err) {
    console.error('[SDRG] PDF error:', err);
    alert('Could not generate PDF. Please try again.');
  } finally {
    if (btn) { btn.textContent = '⬇ Download Certificate (PDF)'; btn.disabled = false; }
  }
};

/* ============================================================
   RESTART
   ============================================================ */
window.restartTraining = function() {
  safeClear();
  selectedVoice   = null;
  currentScenario = 0;
  scores          = new Array(TOTAL_SCENARIOS).fill(null);
  attempts        = new Array(TOTAL_SCENARIOS).fill(0);
  sigCtx          = null;
  sigHasData      = false;

  const audio = $v('mainAudio');
  audio.pause(); audio.src = '';

  document.querySelectorAll('.voice-card').forEach(c => c.classList.remove('selected'));
  const sb = $v('start-btn'); if (sb) sb.disabled = true;
  const vh = $v('voice-hint'); if (vh) vh.textContent = 'Select an instructor above to continue';
  const rb = $v('resume-banner'); if (rb) rb.style.display = 'none';

  showScreen('voice');
};

/* ── INIT ── */
showScreen('voice');
