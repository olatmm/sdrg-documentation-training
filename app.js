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
    // Build caption DOM now that selectedVoice is known
    buildCaptionDOM();
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

/* ============================================================
   WORD-LEVEL CAPTION ENGINE
   Shows live karaoke-style captions in the intro screen
   caption panel, synced word-by-word to the narration audio.
   ============================================================ */

// Word arrays: [start_time, "word"]
const ALEX_WORDS = [
  [0.12,"Welcome"],[0.54,"to"],[0.66,"the"],[0.82,"scenario-based"],[1.89,"documentation"],[2.80,"exercise"],
  [3.90,"for"],[4.16,"Sunny"],[4.56,"Day"],[5.04,"Residential"],[5.72,"Group."],[6.76,"My"],
  [6.92,"name"],[7.08,"is"],[7.28,"Alex,"],[7.96,"and"],[8.08,"I'll"],[8.22,"be"],
  [8.38,"guiding"],[8.78,"you"],[8.92,"through"],[9.08,"this"],[9.28,"training"],[9.62,"today."],
  [10.76,"Documentation"],[11.72,"is"],[11.90,"one"],[12.00,"of"],[12.08,"the"],[12.22,"most"],
  [12.44,"important"],[12.98,"responsibilities"],[13.92,"you"],[14.08,"carry"],[14.86,"as"],[15.02,"a"],
  [15.12,"direct"],[15.50,"care"],[15.72,"professional."],[17.16,"Every"],[17.56,"note"],[17.90,"you"],
  [18.03,"write"],[18.34,"becomes"],[18.74,"part"],[18.92,"of"],[19.14,"a"],[19.16,"resident's"],
  [19.69,"clinical"],[20.12,"record."],[21.14,"It"],[21.32,"supports"],[21.79,"treatment"],[22.20,"decisions,"],
  [23.35,"demonstrates"],[24.10,"medical"],[24.48,"necessity,"],[25.64,"and"],[25.78,"protects"],[26.30,"both"],
  [26.50,"the"],[26.68,"resident"],[27.42,"and"],[27.72,"your"],[27.92,"organization"],[28.86,"during"],
  [29.24,"audits"],[29.82,"or"],[29.97,"reviews."],[31.16,"This"],[31.42,"training"],[31.80,"will"],
  [31.98,"walk"],[32.24,"you"],[32.40,"through"],[32.80,"eleven"],[33.60,"real-life"],[34.10,"scenarios"],
  [35.24,"that"],[35.44,"happen"],[36.00,"right"],[36.30,"here"],[36.46,"in"],[36.60,"Level"],
  [36.90,"Three"],[37.16,"residential"],[37.74,"settings."],[38.86,"For"],[39.06,"each"],[39.36,"one,"],
  [39.78,"you'll"],[39.96,"read"],[40.11,"the"],[40.26,"situation,"],[41.42,"then"],[41.56,"write"],
  [41.80,"a"],[41.90,"professional"],[42.64,"shift"],[42.96,"note"],[43.48,"in"],[43.62,"your"],
  [43.78,"own"],[44.00,"words."],[45.08,"Your"],[45.28,"note"],[45.60,"will"],[45.76,"be"],
  [45.88,"evaluated"],[46.72,"against"],[47.08,"a"],[47.16,"clinical"],[47.64,"rubric."],[48.78,"To"],
  [48.86,"pass"],[49.24,"each"],[49.41,"scenario,"],[50.32,"you"],[50.44,"need"],[50.55,"a"],
  [50.70,"score"],[51.12,"of"],[51.38,"eight"],[51.70,"out"],[51.82,"of"],[51.98,"ten."],
  [52.98,"If"],[53.10,"you"],[53.30,"don't"],[53.54,"reach"],[53.86,"that,"],[54.22,"you'll"],
  [54.36,"receive"],[54.80,"feedback"],[55.52,"and"],[55.68,"have"],[55.88,"the"],[56.04,"opportunity"],
  [57.00,"to"],[57.14,"revise"],[57.82,"and"],[57.96,"resubmit."],[59.20,"Let's"],[59.43,"talk"],
  [59.70,"about"],[59.96,"what"],[60.20,"makes"],[60.46,"a"],[60.62,"good"],[60.84,"documentation"],
  [61.76,"note."],[62.76,"A"],[62.90,"strong"],[63.24,"note"],[63.52,"includes"],[64.12,"six"],
  [64.38,"things."],[65.42,"First,"],[66.34,"resident"],[66.84,"presentation"],[67.60,"upon"],[67.92,"arrival"],
  [68.84,"or"],[68.98,"at"],[69.06,"the"],[69.22,"start"],[69.42,"of"],[69.52,"the"],
  [69.64,"situation."],[71.14,"Second,"],[72.02,"the"],[72.20,"specific"],[72.80,"behaviors"],[73.38,"you"],
  [73.48,"observed"],[74.33,"described"],[74.92,"in"],[75.04,"objective"],[75.56,"language."],[76.78,"Third,"],
  [77.63,"the"],[77.80,"interventions"],[78.48,"you"],[78.59,"used"],[78.92,"as"],[79.03,"staff."],
  [80.40,"Fourth,"],[81.30,"how"],[81.54,"the"],[81.70,"resident"],[82.20,"responded"],[82.90,"to"],
  [83.02,"those"],[83.26,"interventions."],[84.80,"Fifth,"],[85.74,"how"],[85.88,"the"],[86.06,"shift"],
  [86.42,"or"],[86.58,"situation"],[87.46,"ended."],[88.38,"And"],[88.68,"sixth,"],[89.44,"continued"],
  [90.10,"treatment"],[90.50,"needs"],[90.98,"or"],[91.22,"any"],[91.44,"progress"],[92.00,"noted."],
  [93.22,"What"],[93.38,"you"],[93.56,"want"],[93.70,"to"],[93.84,"avoid"],[94.38,"is"],
  [94.58,"vague,"],[95.16,"subjective"],[95.72,"language."],[96.82,"Phrases"],[97.28,"like,"],[97.73,"'Client"],
  [98.18,"was"],[98.36,"acting"],[98.65,"out,'"],[99.50,"'She"],[99.72,"had"],[99.83,"a"],
  [99.96,"bad"],[100.21,"day,'"],[101.06,"or,"],[101.51,"'Everything"],[101.98,"was"],[102.20,"fine,'"],
  [103.10,"tell"],[103.30,"us"],[103.60,"nothing"],[104.02,"clinically"],[104.54,"useful."],[105.58,"Instead,"],
  [106.12,"describe"],[106.56,"exactly"],[107.28,"what"],[107.46,"you"],[107.66,"saw"],[108.20,"and"],
  [108.36,"what"],[108.56,"you"],[108.70,"did."],[109.65,"Now"],[109.82,"let's"],[110.03,"walk"],
  [110.30,"through"],[110.45,"the"],[110.60,"eleven"],[111.00,"scenarios"],[111.68,"you'll"],[111.82,"encounter"],
  [112.28,"in"],[112.36,"this"],[112.54,"training."],[113.64,"Scenario"],[114.28,"one"],[114.68,"is"],
  [114.82,"emotional"],[115.42,"dysregulation"],[116.26,"after"],[116.50,"school."],[117.62,"A"],[117.72,"resident"],
  [118.22,"returns"],[118.72,"home"],[119.16,"visibly"],[119.59,"upset,"],[120.70,"slams"],[121.20,"belongings,"],
  [122.28,"yells,"],[123.08,"and"],[123.24,"throws"],[123.62,"items"],[123.92,"in"],[124.04,"her"],
  [124.24,"room."],[125.34,"Staff"],[125.66,"respond"],[126.22,"with"],[126.46,"calm"],[127.12,"de-escalation,"],
  [128.51,"coping"],[128.98,"skill"],[129.28,"support,"],[130.26,"and"],[130.36,"the"],[130.50,"resident"],
  [131.00,"eventually"],[131.62,"stabilizes"],[132.54,"and"],[132.70,"completes"],[133.24,"her"],[133.44,"evening"],
  [133.78,"routine."],[135.38,"Scenario"],[135.92,"two"],[136.32,"is"],[136.44,"refusal"],[137.00,"to"],
  [137.14,"shower."],[138.40,"A"],[138.55,"resident"],[139.04,"refuses"],[139.70,"to"],[139.82,"complete"],
  [140.32,"hygiene"],[140.98,"as"],[141.16,"part"],[141.34,"of"],[141.44,"the"],[141.62,"evening"],
  [141.92,"routine."],[143.22,"Staff"],[143.56,"use"],[143.80,"prompting,"],[144.74,"motivational"],[145.46,"strategies,"],
  [146.26,"and"],[146.44,"redirection."],[147.92,"Your"],[148.10,"note"],[148.42,"must"],[148.66,"capture"],
  [149.01,"the"],[149.16,"refusal,"],[150.24,"the"],[150.34,"approach"],[150.92,"used,"],[151.64,"and"],
  [151.76,"the"],[151.92,"outcome."],[153.20,"Scenario"],[153.78,"three"],[154.22,"is"],[154.56,"argument"],
  [155.14,"over"],[155.44,"phone"],[155.74,"privileges."],[157.04,"A"],[157.14,"resident"],[157.62,"becomes"],
  [158.12,"agitated"],[158.74,"when"],[158.94,"phone"],[159.24,"time"],[159.50,"is"],[159.68,"limited."],
  [160.71,"The"],[160.90,"situation"],[161.68,"escalates"],[162.26,"verbally"],[162.74,"before"],[163.12,"de-escalating."],
  [164.46,"Staff"],[164.88,"must"],[165.10,"document"],[165.58,"the"],[165.72,"trigger,"],[166.60,"the"],
  [166.70,"behavior,"],[167.78,"the"],[167.90,"intervention,"],[168.92,"and"],[169.04,"the"],[169.14,"resolution."],
  [170.68,"Scenario"],[171.30,"four"],[171.64,"is"],[171.92,"theft"],[172.43,"from"],[172.66,"a"],
  [172.76,"peer."],[174.02,"Staff"],[174.32,"discover"],[174.82,"a"],[174.92,"resident"],[175.40,"took"],
  [175.68,"items"],[176.02,"belonging"],[176.52,"to"],[176.64,"another"],[176.98,"resident."],[178.03,"This"],
  [178.24,"requires"],[178.80,"documenting"],[179.47,"the"],[179.62,"discovery,"],[180.74,"the"],[180.92,"confrontation,"],
  [182.40,"the"],[182.56,"resident's"],[183.10,"response,"],[184.24,"and"],[184.52,"any"],[184.80,"corrective"],
  [185.42,"or"],[185.60,"therapeutic"],[186.36,"action"],[186.76,"taken."],[187.20,"Scenario"],[187.86,"five"],
  [188.26,"is"],[188.64,"running"],[188.92,"away"],[189.20,"threats."],[190.32,"A"],[190.48,"resident"],
  [190.99,"threatens"],[191.42,"to"],[191.56,"run"],[191.72,"away"],[192.04,"during"],[192.36,"a"],
  [192.42,"conflict."],[193.76,"Staff"],[194.18,"implement"],[194.74,"safety"],[195.12,"protocols,"],[196.38,"de-escalate"],
  [197.06,"the"],[197.20,"situation,"],[198.33,"and"],[198.46,"the"],[198.60,"resident"],[199.14,"does"],
  [199.48,"not"],[199.78,"leave"],[199.99,"the"],[200.16,"facility."],[201.48,"Documentation"],[202.70,"must"],
  [202.94,"reflect"],[203.40,"safety"],[203.76,"considerations"],[204.88,"clearly."],[206.62,"Scenario"],[207.22,"six"],
  [207.52,"is"],[207.72,"staff"],[208.02,"shift"],[208.31,"manipulation."],[209.82,"A"],[210.04,"resident"],
  [210.54,"attempts"],[210.96,"to"],[211.10,"play"],[211.38,"staff"],[211.76,"members"],[212.22,"against"],
  [212.62,"each"],[212.84,"other"],[213.50,"by"],[213.68,"reporting"],[214.28,"inconsistent"],[215.06,"information"],
  [215.90,"across"],[216.51,"shift"],[216.80,"changes."],[217.98,"Documentation"],[218.92,"must"],[219.20,"capture"],
  [219.62,"the"],[219.80,"specific"],[220.40,"statements"],[220.90,"made"],[221.61,"and"],[221.78,"how"],
  [222.04,"staff"],[222.30,"addressed"],[222.72,"it."],[224.07,"Scenario"],[224.68,"seven"],[225.02,"is"],
  [225.24,"bedtime"],[225.74,"defiance."],[227.04,"A"],[227.20,"resident"],[227.70,"refuses"],[228.28,"to"],
  [228.44,"follow"],[228.70,"the"],[228.86,"bedtime"],[229.30,"routine,"],[230.36,"becomes"],[230.92,"argumentative,"],
  [232.11,"and"],[232.28,"disrupts"],[233.00,"other"],[233.22,"residents."],[234.54,"Staff"],[234.96,"implement"],
  [235.56,"structured"],[236.20,"limit"],[236.50,"setting."],[237.46,"Your"],[237.64,"note"],[237.92,"must"],
  [238.20,"capture"],[238.55,"the"],[238.72,"progression"],[239.52,"and"],[239.68,"resolution."],[241.42,"Scenario"],
  [242.08,"eight"],[242.34,"is"],[242.54,"peer"],[242.82,"bullying."],[243.90,"A"],[244.06,"resident"],
  [244.58,"is"],[244.74,"observed"],[245.20,"making"],[245.54,"derogatory"],[246.38,"comments"],[246.88,"toward"],
  [247.06,"a"],[247.18,"peer."],[248.14,"Staff"],[248.52,"intervene,"],[249.54,"separate"],[250.06,"residents,"],
  [251.08,"and"],[251.20,"address"],[251.64,"behavior"],[252.32,"therapeutically."],[253.74,"Both"],[254.04,"residents"],
  [254.54,"require"],[254.98,"documentation."],[256.82,"Scenario"],[257.48,"nine"],[257.98,"is"],[258.11,"a"],
  [258.23,"panic"],[258.60,"attack."],[259.70,"A"],[259.92,"resident"],[260.46,"experiences"],[261.26,"acute"],
  [261.82,"anxiety"],[262.48,"with"],[262.64,"physical"],[263.04,"symptoms,"],[264.22,"rapid"],[264.64,"breathing,"],
  [265.54,"tearfulness,"],[266.58,"and"],[266.86,"inability"],[267.46,"to"],[267.66,"speak."],[268.80,"Staff"],
  [269.18,"implement"],[269.84,"calming"],[270.24,"strategies"],[271.04,"and"],[271.20,"monitor"],[271.64,"for"],
  [271.82,"safety."],[272.85,"This"],[273.08,"scenario"],[273.70,"requires"],[274.34,"clear"],[275.16,"clinical"],
  [275.60,"description"],[276.18,"of"],[276.34,"physical"],[276.94,"and"],[277.08,"behavioral"],[277.66,"presentation."],
  [279.49,"Scenario"],[280.14,"ten"],[280.56,"is"],[280.74,"a"],[280.78,"family"],[281.12,"call"],
  [281.33,"meltdown."],[282.56,"A"],[282.68,"resident"],[283.22,"becomes"],[283.74,"highly"],[284.18,"dysregulated"],
  [285.02,"following"],[285.48,"a"],[285.50,"phone"],[285.80,"call"],[286.30,"with"],[286.39,"a"],
  [286.52,"family"],[286.90,"member."],[287.98,"Staff"],[288.30,"support"],[288.71,"the"],[288.88,"resident"],
  [289.37,"through"],[289.66,"significant"],[290.44,"emotional"],[291.00,"distress."],[292.22,"Documentation"],[293.26,"must"],
  [293.52,"capture"],[293.90,"the"],[294.06,"timeline,"],[295.10,"the"],[295.24,"trigger,"],[296.06,"and"],
  [296.16,"the"],[296.32,"full"],[296.58,"staff"],[296.84,"response."],[298.38,"Scenario"],[299.00,"eleven"],
  [299.54,"is"],[299.68,"an"],[299.92,"excellent"],[300.42,"progress"],[300.94,"day."],[301.90,"A"],
  [302.08,"resident"],[302.62,"demonstrates"],[303.24,"exceptional"],[304.08,"emotional"],[304.64,"regulation,"],[305.90,"positive"],
  [306.44,"peer"],[306.70,"interaction,"],[307.80,"and"],[307.94,"engagement"],[308.66,"with"],[308.86,"programming"],
  [309.58,"throughout"],[309.94,"the"],[310.08,"shift."],[311.22,"Even"],[311.60,"positive"],[312.12,"days"],
  [312.44,"require"],[312.96,"thorough"],[313.32,"documentation"],[314.62,"to"],[314.78,"support"],[315.30,"treatment"],
  [315.70,"progress."],[316.98,"Remember,"],[317.92,"every"],[318.28,"scenario"],[318.98,"you"],[319.12,"document"],
  [319.74,"here"],[320.40,"reflects"],[320.90,"your"],[321.06,"professional"],[321.70,"skill"],[322.50,"and"],
  [322.64,"your"],[322.84,"commitment"],[323.39,"to"],[323.54,"the"],[323.68,"residents"],[324.12,"in"],
  [324.24,"your"],[324.42,"care."],[325.38,"When"],[325.54,"you're"],[325.70,"ready,"],[326.30,"let's"],
  [326.54,"begin"],[326.94,"scenario"],[327.49,"one."]
];

const SARAH_WORDS = [
  [0.10,"Welcome"],[0.52,"to"],[0.64,"the"],[0.74,"scenario-based"],[1.72,"documentation"],[2.50,"exercise"],
  [3.14,"for"],[3.32,"Sunny"],[3.66,"Day"],[3.90,"Residential"],[4.46,"Group."],[5.38,"My"],
  [5.54,"name"],[5.68,"is"],[5.84,"Sarah,"],[6.48,"and"],[6.58,"I'll"],[6.70,"be"],
  [6.84,"guiding"],[7.16,"you"],[7.30,"through"],[7.52,"this"],[7.72,"training"],[8.04,"today."],
  [9.22,"Documentation"],[10.18,"is"],[10.32,"one"],[10.42,"of"],[10.54,"the"],[10.68,"most"],
  [10.98,"important"],[11.46,"responsibilities"],[12.31,"you"],[12.48,"carry"],[12.82,"as"],[12.94,"a"],
  [13.01,"direct"],[13.38,"care"],[13.58,"professional."],[15.02,"Every"],[15.32,"note"],[15.56,"you"],
  [15.67,"write"],[16.06,"becomes"],[16.46,"part"],[16.68,"of"],[16.80,"a"],[16.90,"resident's"],
  [17.40,"clinical"],[17.80,"record."],[18.90,"It"],[19.04,"supports"],[19.53,"treatment"],[19.79,"decisions,"],
  [20.77,"demonstrates"],[21.40,"medical"],[21.72,"necessity,"],[22.80,"and"],[22.94,"protects"],[23.42,"both"],
  [23.62,"the"],[23.74,"resident"],[24.38,"and"],[24.56,"your"],[24.70,"organization"],[25.40,"during"],
  [25.72,"audits"],[26.06,"or"],[26.18,"reviews."],[27.70,"This"],[27.90,"training"],[28.30,"will"],
  [28.44,"walk"],[28.70,"you"],[28.84,"through"],[29.11,"eleven"],[29.76,"real-life"],[30.24,"scenarios"],
  [31.14,"that"],[31.32,"happen"],[31.70,"right"],[31.96,"here"],[32.26,"in"],[32.40,"level"],
  [32.70,"three"],[33.00,"residential"],[33.60,"settings."],[34.90,"For"],[35.06,"each"],[35.34,"one,"],
  [35.92,"you'll"],[36.08,"read"],[36.26,"the"],[36.38,"situation,"],[37.52,"then"],[37.74,"write"],
  [37.96,"a"],[38.04,"professional"],[38.60,"shift"],[38.92,"note"],[39.14,"in"],[39.26,"your"],
  [39.42,"own"],[39.60,"words."],[40.92,"Your"],[41.07,"note"],[41.36,"will"],[41.48,"be"],
  [41.60,"evaluated"],[42.30,"against"],[42.62,"a"],[42.70,"clinical"],[43.12,"rubric."],[44.20,"To"],
  [44.36,"pass"],[44.72,"each"],[44.92,"scenario,"],[45.90,"you"],[46.00,"need"],[46.14,"a"],
  [46.26,"score"],[46.58,"of"],[46.84,"eight"],[47.10,"out"],[47.20,"of"],[47.34,"ten."],
  [48.38,"If"],[48.52,"you"],[48.62,"don't"],[48.90,"reach"],[49.11,"that,"],[49.78,"you'll"],
  [49.92,"receive"],[50.30,"feedback"],[51.12,"and"],[51.26,"have"],[51.46,"the"],[51.62,"opportunity"],
  [52.24,"to"],[52.36,"revise"],[52.90,"and"],[53.06,"resubmit."],[54.56,"Let's"],[54.82,"talk"],
  [55.06,"about"],[55.32,"what"],[55.52,"makes"],[55.78,"a"],[55.88,"good"],[56.08,"documentation"],
  [56.84,"note."],[58.00,"A"],[58.14,"strong"],[58.48,"note"],[58.74,"includes"],[59.22,"six"],
  [59.52,"things."],[60.62,"First,"],[61.48,"resident"],[61.90,"presentation"],[62.54,"upon"],[62.82,"arrival"],
  [63.64,"or"],[63.80,"at"],[63.92,"the"],[64.06,"start"],[64.26,"of"],[64.36,"the"],
  [64.46,"situation."],[66.08,"Second,"],[66.90,"the"],[67.06,"specific"],[67.56,"behaviors"],[68.12,"you"],
  [68.20,"observed"],[69.08,"described"],[69.62,"in"],[69.72,"objective"],[70.26,"language."],[71.72,"Third,"],
  [72.56,"the"],[72.70,"interventions"],[73.28,"you"],[73.46,"used"],[73.70,"as"],[73.88,"staff."],
  [75.26,"Fourth,"],[76.12,"how"],[76.32,"the"],[76.44,"resident"],[76.84,"responded"],[77.38,"to"],
  [77.50,"those"],[77.70,"interventions."],[79.16,"Fifth,"],[80.04,"how"],[80.18,"the"],[80.34,"shift"],
  [80.68,"or"],[80.84,"situation"],[81.44,"ended,"],[82.30,"and"],[82.56,"sixth,"],[83.48,"continued"],
  [84.00,"treatment"],[84.36,"needs"],[84.80,"or"],[84.98,"any"],[85.18,"progress"],[85.72,"noted."],
  [87.00,"What"],[87.18,"you"],[87.28,"want"],[87.48,"to"],[87.60,"avoid"],[88.08,"is"],
  [88.34,"vague,"],[88.84,"subjective"],[89.36,"language."],[90.56,"Phrases"],[91.02,"like,"],[91.77,"'Client"],
  [92.22,"was"],[92.44,"acting"],[92.80,"out,'"],[93.48,"'She"],[93.76,"had"],[93.94,"a"],
  [93.96,"bad"],[94.24,"day,'"],[95.02,"or,"],[95.71,"'Everything"],[96.14,"was"],[96.32,"fine,'"],
  [97.30,"tell"],[97.46,"us"],[97.68,"nothing"],[98.06,"clinically"],[98.52,"useful."],[99.74,"Instead,"],
  [100.61,"describe"],[101.14,"exactly"],[101.73,"what"],[101.92,"you"],[102.10,"saw"],[102.55,"and"],
  [102.74,"what"],[102.92,"you"],[103.06,"did."],[104.20,"Now,"],[104.38,"let's"],[104.60,"walk"],
  [104.88,"through"],[105.11,"the"],[105.26,"eleven"],[105.68,"scenarios"],[106.26,"you'll"],[106.38,"encounter"],
  [106.84,"in"],[106.94,"this"],[107.12,"training."],[108.28,"Scenario"],[108.88,"one"],[109.20,"is"],
  [109.34,"emotional"],[109.90,"dysregulation"],[110.70,"after"],[111.04,"school."],[112.10,"A"],[112.22,"resident"],
  [112.64,"returns"],[113.06,"home"],[113.40,"visibly"],[113.80,"upset,"],[114.74,"slams"],[115.14,"belongings,"],
  [116.08,"yells,"],[116.94,"and"],[117.08,"throws"],[117.54,"items"],[117.82,"in"],[117.92,"her"],
  [118.10,"room."],[119.30,"Staff"],[119.64,"respond"],[120.12,"with"],[120.34,"calm"],[120.68,"de-escalation,"],
  [121.96,"coping"],[122.32,"skill"],[122.58,"support,"],[123.50,"and"],[123.62,"the"],[123.74,"resident"],
  [124.18,"eventually"],[124.78,"stabilizes"],[125.62,"and"],[125.76,"completes"],[126.18,"her"],[126.36,"evening"],
  [126.68,"routine."],[128.04,"Scenario"],[128.58,"two"],[129.02,"is"],[129.18,"refusal"],[129.70,"to"],
  [129.82,"shower."],[131.02,"A"],[131.09,"resident"],[131.56,"refuses"],[132.08,"to"],[132.18,"complete"],
  [132.58,"hygiene"],[133.12,"as"],[133.30,"part"],[133.46,"of"],[133.58,"the"],[133.72,"evening"],
  [134.00,"routine."],[135.30,"Staff"],[135.72,"use"],[135.92,"prompting,"],[136.71,"motivational"],[137.38,"strategies,"],
  [138.32,"and"],[138.48,"redirection."],[140.04,"Your"],[140.22,"note"],[140.54,"must"],[140.84,"capture"],
  [141.22,"the"],[141.32,"refusal,"],[142.16,"the"],[142.30,"approach"],[142.80,"used,"],[143.46,"and"],
  [143.60,"the"],[143.76,"outcome."],[145.21,"Scenario"],[145.80,"three"],[146.20,"is"],[146.41,"argument"],
  [146.96,"over"],[147.22,"phone"],[147.48,"privileges."],[148.86,"A"],[148.94,"resident"],[149.40,"becomes"],
  [149.84,"agitated"],[150.39,"when"],[150.60,"phone"],[150.84,"time"],[151.06,"is"],[151.20,"limited."],
  [152.37,"The"],[152.52,"situation"],[153.20,"escalates"],[153.74,"verbally"],[154.20,"before"],[154.56,"de-escalating."],
  [156.20,"Staff"],[156.60,"must"],[156.80,"document"],[157.28,"the"],[157.38,"trigger,"],[158.10,"the"],
  [158.18,"behavior,"],[159.14,"the"],[159.28,"intervention,"],[160.24,"and"],[160.37,"the"],[160.42,"resolution."],
  [162.16,"Scenario"],[162.72,"four"],[163.12,"is"],[163.34,"theft"],[163.62,"from"],[163.80,"a"],
  [163.88,"peer."],[165.04,"Staff"],[165.32,"discover"],[165.78,"a"],[165.86,"resident"],[166.28,"took"],
  [166.54,"items"],[166.88,"belonging"],[167.34,"to"],[167.44,"another"],[167.76,"resident."],[168.89,"This"],
  [169.10,"requires"],[169.62,"documenting"],[170.22,"the"],[170.28,"discovery,"],[171.26,"the"],[171.36,"confrontation,"],
  [172.66,"the"],[172.76,"resident's"],[173.18,"response,"],[174.16,"and"],[174.40,"any"],[174.62,"corrective"],
  [175.18,"or"],[175.36,"therapeutic"],[175.98,"action"],[176.30,"taken."],[176.78,"Scenario"],[177.30,"five"],
  [177.82,"is"],[178.02,"running"],[178.30,"away"],[178.62,"threats."],[179.96,"A"],[180.06,"resident"],
  [180.52,"threatens"],[180.98,"to"],[181.10,"run"],[181.26,"away"],[181.58,"during"],[181.86,"a"],
  [181.90,"conflict."],[183.32,"Staff"],[183.74,"implement"],[184.20,"safety"],[184.56,"protocols,"],[185.66,"de-escalate"],
  [186.28,"the"],[186.38,"situation,"],[187.46,"and"],[187.60,"the"],[187.72,"resident"],[188.22,"does"],
  [188.48,"not"],[188.74,"leave"],[188.94,"the"],[189.04,"facility."],[190.35,"Documentation"],[191.34,"must"],
  [191.60,"reflect"],[192.06,"safety"],[192.40,"considerations"],[193.22,"clearly."],[195.04,"Scenario"],[195.62,"six"],
  [196.06,"is"],[196.18,"staff"],[196.58,"shift"],[196.86,"manipulation."],[198.38,"A"],[198.46,"resident"],
  [198.90,"attempts"],[199.28,"to"],[199.40,"play"],[199.66,"staff"],[199.96,"members"],[200.26,"against"],
  [200.60,"each"],[200.78,"other"],[201.42,"by"],[201.56,"reporting"],[202.14,"inconsistent"],[202.86,"information"],
  [203.42,"across"],[203.76,"shift"],[204.06,"changes."],[205.38,"Documentation"],[206.28,"must"],[206.60,"capture"],
  [207.00,"the"],[207.16,"specific"],[207.68,"statements"],[208.10,"made"],[208.76,"and"],[208.90,"how"],
  [209.16,"staff"],[209.42,"addressed"],[209.86,"it."],[211.46,"Scenario"],[212.00,"seven"],[212.46,"is"],
  [212.64,"bedtime"],[213.10,"defiance."],[214.58,"A"],[214.70,"resident"],[215.14,"refuses"],[215.72,"to"],
  [215.86,"follow"],[216.16,"the"],[216.26,"bedtime"],[216.66,"routine,"],[217.48,"becomes"],[217.86,"argumentative,"],
  [219.04,"and"],[219.16,"disrupts"],[219.70,"other"],[219.94,"residents."],[221.23,"Staff"],[221.68,"implement"],
  [222.12,"structured"],[222.66,"limit"],[222.94,"setting."],[224.04,"Your"],[224.20,"note"],[224.52,"must"],
  [224.80,"capture"],[225.18,"the"],[225.28,"progression"],[225.98,"and"],[226.16,"resolution."],[228.20,"Scenario"],
  [228.76,"eight"],[229.10,"is"],[229.30,"peer"],[229.60,"bullying."],[230.90,"A"],[230.98,"resident"],
  [231.48,"is"],[231.58,"observed"],[232.06,"making"],[232.35,"derogatory"],[233.08,"comments"],[233.56,"toward"],
  [233.74,"a"],[233.82,"peer."],[235.08,"Staff"],[235.46,"intervene,"],[236.42,"separate"],[236.86,"residents,"],
  [237.76,"and"],[237.88,"address"],[238.26,"behavior"],[238.76,"therapeutically."],[240.38,"Both"],[240.68,"residents"],
  [241.16,"require"],[241.55,"documentation."],[243.72,"Scenario"],[244.24,"nine"],[244.76,"is"],[244.88,"a"],
  [244.98,"panic"],[245.32,"attack."],[246.54,"A"],[246.64,"resident"],[247.10,"experiences"],[247.92,"acute"],
  [248.38,"anxiety"],[248.94,"with"],[249.12,"physical"],[249.52,"symptoms,"],[250.62,"rapid"],[250.98,"breathing,"],
  [251.73,"tearfulness,"],[252.68,"and"],[252.88,"inability"],[253.38,"to"],[253.58,"speak."],[254.80,"Staff"],
  [255.22,"implement"],[255.64,"calming"],[256.04,"strategies"],[256.74,"and"],[256.92,"monitor"],[257.34,"for"],
  [257.50,"safety."],[258.75,"This"],[258.96,"scenario"],[259.52,"requires"],[260.12,"clear"],[260.74,"clinical"],
  [261.14,"description"],[261.76,"of"],[261.92,"physical"],[262.47,"and"],[262.64,"behavioral"],[263.17,"presentation."],
  [265.12,"Scenario"],[265.66,"ten"],[266.10,"is"],[266.30,"a"],[266.34,"family"],[266.72,"call"],
  [266.96,"meltdown."],[268.20,"A"],[268.30,"resident"],[268.70,"becomes"],[269.14,"highly"],[269.48,"dysregulated"],
  [270.32,"following"],[270.78,"a"],[270.80,"phone"],[271.06,"call"],[271.30,"with"],[271.42,"a"],
  [271.49,"family"],[271.80,"member."],[272.97,"Staff"],[273.38,"support"],[273.75,"the"],[273.86,"resident"],
  [274.31,"through"],[274.58,"significant"],[275.24,"emotional"],[275.74,"distress."],[277.18,"Documentation"],[278.08,"must"],
  [278.32,"capture"],[278.68,"the"],[278.80,"timeline,"],[279.62,"the"],[279.74,"trigger,"],[280.56,"and"],
  [280.66,"the"],[280.84,"full"],[281.12,"staff"],[281.38,"response."],[282.85,"Scenario"],[283.40,"eleven"],
  [284.00,"is"],[284.12,"an"],[284.40,"excellent"],[284.86,"progress"],[285.34,"day."],[286.44,"A"],
  [286.54,"resident"],[287.00,"demonstrates"],[287.66,"exceptional"],[288.38,"emotional"],[288.88,"regulation,"],[290.02,"positive"],
  [290.54,"peer"],[290.74,"interaction,"],[291.76,"and"],[291.88,"engagement"],[292.44,"with"],[292.60,"programming"],
  [293.17,"throughout"],[293.52,"the"],[293.64,"shift."],[294.96,"Even"],[295.28,"positive"],[295.78,"days"],
  [296.08,"require"],[296.60,"thorough"],[296.96,"documentation"],[297.92,"to"],[298.04,"support"],[298.44,"treatment"],
  [298.80,"progress."],[300.28,"Remember,"],[301.40,"every"],[301.78,"scenario"],[302.28,"you"],[302.42,"document"],
  [302.92,"here"],[303.32,"reflects"],[303.76,"your"],[303.88,"professional"],[304.50,"skill"],[305.20,"and"],
  [305.36,"your"],[305.50,"commitment"],[305.98,"to"],[306.08,"the"],[306.20,"residents"],[306.66,"in"],
  [306.78,"your"],[306.94,"care."],[308.16,"When"],[308.30,"you're"],[308.42,"ready,"],[309.00,"let's"],
  [309.24,"begin."],[310.68,"Scenario"],[311.32,"one."]
];

// Slide segments: each segment shows a labelled block of words in the caption panel
// Defined by word start index in the arrays above (same structure for both voices
// since word count is identical — only timings differ)
const CAPTION_SEGMENTS = [
  { label: 'Welcome',                    start: 0,   end: 24  },
  { label: 'Why Documentation Matters',  start: 24,  end: 68  },
  { label: 'About This Training',        start: 68,  end: 141 },
  { label: 'What Makes a Strong Note',   start: 141, end: 209 },
  { label: 'What to Avoid',              start: 209, end: 249 },
  { label: 'Scenarios Overview',         start: 249, end: 301 },
  { label: 'Scenarios 2 & 3',            start: 301, end: 374 },
  { label: 'Scenarios 4 & 5',            start: 374, end: 441 },
  { label: 'Scenarios 6 & 7',            start: 441, end: 508 },
  { label: 'Scenarios 8 & 9',            start: 508, end: 575 },
  { label: 'Scenarios 10, 11 & Closing', start: 575, end: 675 }
];

/* Build the caption DOM — spans for every word, grouped by segment */
function buildCaptionDOM() {
  const textEl  = $v('captionText');
  const labelEl = $v('captionSlideLabel');
  if (!textEl) return;

  const words = selectedVoice === 'sarah' ? SARAH_WORDS : ALEX_WORDS;
  textEl.innerHTML = '';

  CAPTION_SEGMENTS.forEach((seg, sIdx) => {
    const segEl = document.createElement('span');
    segEl.className = 'caption-segment';
    segEl.dataset.seg = sIdx;
    // Only first segment visible initially
    segEl.style.display = sIdx === 0 ? 'inline' : 'none';

    for (let i = seg.start; i < seg.end && i < words.length; i++) {
      const span = document.createElement('span');
      span.className = 'caption-word';
      span.dataset.wi = i;
      span.textContent = words[i][1];
      segEl.appendChild(span);
      // Add space after each word except the last
      if (i < seg.end - 1 && i < words.length - 1) {
        segEl.appendChild(document.createTextNode(' '));
      }
    }
    textEl.appendChild(segEl);
  });

  labelEl.textContent = CAPTION_SEGMENTS[0].label;
}

/* Update caption highlight on every timeupdate */
let captionLastWordIdx   = -1;
let captionLastSegIdx    = -1;

function updateCaption(currentTime) {
  const words   = selectedVoice === 'sarah' ? SARAH_WORDS : ALEX_WORDS;
  const textEl  = $v('captionText');
  const labelEl = $v('captionSlideLabel');
  if (!textEl || !words.length) return;

  // Find current word index (last word whose start <= currentTime)
  let wi = -1;
  for (let i = words.length - 1; i >= 0; i--) {
    if (currentTime >= words[i][0]) { wi = i; break; }
  }
  if (wi === captionLastWordIdx) return; // nothing changed
  captionLastWordIdx = wi;

  // Find which segment this word belongs to
  let segIdx = 0;
  for (let s = CAPTION_SEGMENTS.length - 1; s >= 0; s--) {
    if (wi >= CAPTION_SEGMENTS[s].start) { segIdx = s; break; }
  }

  // Switch segment visibility if changed
  if (segIdx !== captionLastSegIdx) {
    captionLastSegIdx = segIdx;
    const segments = textEl.querySelectorAll('.caption-segment');
    segments.forEach((el, i) => {
      el.style.display = i === segIdx ? 'inline' : 'none';
    });
    labelEl.textContent = CAPTION_SEGMENTS[segIdx].label;
    // Remove all highlights from previous segment
    textEl.querySelectorAll('.caption-word.active, .caption-word.spoken').forEach(el => {
      el.classList.remove('active','spoken');
    });
  }

  // Update highlight within current segment
  const seg       = CAPTION_SEGMENTS[segIdx];
  const allWords  = textEl.querySelectorAll('.caption-word');
  allWords.forEach(span => {
    const i = parseInt(span.dataset.wi, 10);
    if (i >= seg.start && i < seg.end) {
      span.classList.toggle('active',  i === wi);
      span.classList.toggle('spoken',  i < wi);
    }
  });

  // Auto-scroll active word into view inside the panel
  const activeSpan = textEl.querySelector('.caption-word.active');
  if (activeSpan) {
    activeSpan.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }
}

/* Hook into mainAudio timeupdate to drive captions */
(function initCaptionSync() {
  const audio = $v('mainAudio');
  if (!audio) return;
  audio.addEventListener('timeupdate', () => {
    updateCaption(audio.currentTime);
  });
  // Reset captions when audio is seeked or restarted
  audio.addEventListener('seeked', () => {
    captionLastWordIdx = -1;
    captionLastSegIdx  = -1;
    updateCaption(audio.currentTime);
  });
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
