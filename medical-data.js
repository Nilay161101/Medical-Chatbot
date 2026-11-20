/**
 * MediPulse AI - Clinical & Pharmacological Knowledge Base
 */

const RED_FLAG_KEYWORDS = [
  "chest pain", "crushing chest", "pressure in chest", "shortness of breath", "can't breathe",
  "slurred speech", "facial drooping", "arm weakness", "numbness on one side", "stroke",
  "coughing blood", "vomiting blood", "bluish lips", "loss of consciousness", "fainted",
  "severe sudden headache", "thunderclap headache", "anaphylaxis", "throat swelling",
  "thoughts of suicide", "self harm", "overdose", "poisoning"
];

const MEDICATIONS_DATABASE = [
  {
    id: "med-1",
    name: "Aspirin",
    genericName: "Acetylsalicylic Acid",
    category: "NSAID / Antiplatelet",
    commonDosage: "81mg - 325mg daily",
    uses: "Pain relief, anti-inflammatory, fever reduction, blood clot prevention.",
    sideEffects: ["Upset stomach", "Heartburn", "Increased bleeding risk", "Tinnitus (high dose)"],
    warnings: "Do not take if you have active stomach ulcers or bleeding disorders."
  },
  {
    id: "med-2",
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    category: "NSAID",
    commonDosage: "200mg - 400mg every 4-6 hours (Max 1200mg/day OTC)",
    uses: "Inflammation, fever, headache, muscle pain, arthritis.",
    sideEffects: ["Nausea", "Stomach pain", "Dizziness", "Fluid retention"],
    warnings: "May increase cardiovascular risk and cause gastrointestinal ulceration if used long-term."
  },
  {
    id: "med-3",
    name: "Acetaminophen",
    genericName: "Paracetamol / Tylenol",
    category: "Analgesic / Antipyretic",
    commonDosage: "325mg - 500mg every 4-6 hours (Max 3000mg-4000mg/day)",
    uses: "Mild to moderate pain, fever reducer.",
    sideEffects: ["Rare at normal doses", "Nausea", "Rash"],
    warnings: "Overdose can cause severe liver damage. Avoid combining multiple products containing acetaminophen or heavy alcohol use."
  },
  {
    id: "med-4",
    name: "Lisinopril",
    genericName: "Lisinopril",
    category: "ACE Inhibitor",
    commonDosage: "10mg - 40mg once daily",
    uses: "High blood pressure (Hypertension), heart failure, post-myocardial infarction.",
    sideEffects: ["Dry persistent cough", "Dizziness", "Headache", "Elevated potassium"],
    warnings: "Do not use during pregnancy. Watch for signs of angioedema (face/lip swelling)."
  },
  {
    id: "med-5",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    category: "Antidiabetic (Biguanide)",
    commonDosage: "500mg - 1000mg twice daily with meals",
    uses: "Type 2 Diabetes Mellitus glycemic control.",
    sideEffects: ["Diarrhea", "Nausea", "Abdominal discomfort", "B12 deficiency long-term"],
    warnings: "Risk of lactic acidosis. Take with food to reduce GI symptoms."
  },
  {
    id: "med-6",
    name: "Warfarin",
    genericName: "Warfarin Sodium (Coumadin)",
    category: "Anticoagulant (Blood Thinner)",
    commonDosage: "2mg - 10mg daily (dosed by INR blood tests)",
    uses: "Prevention of DVT, pulmonary embolism, atrial fibrillation clot risk.",
    sideEffects: ["Easy bruising", "Bleeding gums", "Minor nosebleeds"],
    warnings: "High bleeding hazard! Requires regular INR monitoring. Strict dietary vitamin K awareness."
  },
  {
    id: "med-7",
    name: "Sertraline",
    genericName: "Sertraline (Zoloft)",
    category: "SSRI Antidepressant",
    commonDosage: "50mg - 100mg once daily",
    uses: "Major depression, anxiety disorders, PTSD, OCD.",
    sideEffects: ["Insomnia", "Nausea", "Dry mouth", "Drowsiness", "Sexual dysfunction"],
    warnings: "Do not discontinue abruptly. Risk of Serotonin Syndrome when combined with serotonergic drugs."
  },
  {
    id: "med-8",
    name: "Omeprazole",
    genericName: "Omeprazole (Prilosec)",
    category: "Proton Pump Inhibitor (PPI)",
    commonDosage: "20mg - 40mg once daily before meal",
    uses: "GERD, acid reflux, stomach ulcers, Erosive Esophagitis.",
    sideEffects: ["Headache", "Abdominal pain", "Gas", "Magnesium deficiency long-term"],
    warnings: "Long-term use may increase risk of bone fractures and intestinal infections."
  },
  {
    id: "med-9",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    category: "Penicillin Antibiotic",
    commonDosage: "250mg - 500mg every 8 hours",
    uses: "Bacterial infections (bacterial sinusitis, strep throat, ear infections, UTI).",
    sideEffects: ["Diarrhea", "Mild rash", "Nausea"],
    warnings: "Ineffective against viral infections (flu/cold). Discontinue immediately if allergic hives occur."
  },
  {
    id: "med-10",
    name: "Atorvastatin",
    genericName: "Atorvastatin (Lipitor)",
    category: "HMG-CoA Reductase Inhibitor (Statin)",
    commonDosage: "10mg - 80mg once daily",
    uses: "High cholesterol (hyperlipidemia), cardiovascular risk reduction.",
    sideEffects: ["Muscle aches", "Joint pain", "Elevated liver enzymes (rare)"],
    warnings: "Report severe unexpected muscle weakness or dark urine (rhabdomyolysis risk)."
  },
  {
    id: "med-11",
    name: "Metoprolol",
    genericName: "Metoprolol Succinate / Tartrate",
    category: "Beta Blocker",
    commonDosage: "25mg - 100mg daily",
    uses: "High blood pressure, angina, heart failure, tachycardia.",
    sideEffects: ["Fatigue", "Cold hands/feet", "Slow heart rate (bradycardia)", "Dizziness"],
    warnings: "Do not stop suddenly to avoid rebound hypertension or angina."
  },
  {
    id: "med-12",
    name: "Albuterol",
    genericName: "Albuterol Sulfate (ProAir/Ventolin)",
    category: "Short-Acting Beta-2 Agonist (Bronchodilator)",
    commonDosage: "1-2 puffs every 4-6 hours as needed",
    uses: "Asthma rescue inhaler, acute bronchospasm, COPD symptom relief.",
    sideEffects: ["Shakiness/Tremor", "Rapid heartbeat (tachycardia)", "Nervousness"],
    warnings: "If rescue inhaler is needed >2 times a week for asthma, discuss preventative therapy with doctor."
  }
];

const DRUG_INTERACTIONS = [
  {
    drug1: "Aspirin",
    drug2: "Ibuprofen",
    severity: "High",
    effect: "Increased Gastrointestinal Bleeding Risk & Attenuated Antiplatelet Action",
    description: "Taking Ibuprofen concurrently with Aspirin may diminish the cardioprotective effect of low-dose Aspirin and significantly heighten the risk of stomach ulcers and GI hemorrhage.",
    recommendation: "Avoid co-administration. If both are necessary, take Aspirin at least 30 minutes before or 8 hours after Ibuprofen under physician guidance."
  },
  {
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "Critical",
    effect: "Severe Hemorrhage & Bleeding Hazard",
    description: "Combining anticoagulants (Warfarin) with antiplatelet NSAIDs (Aspirin) synergistically impairs blood clotting, dramatically increasing major internal bleeding risks.",
    recommendation: "Strictly avoid unless specifically prescribed and monitored closely by a hematologist or cardiologist with frequent INR tracking."
  },
  {
    drug1: "Warfarin",
    drug2: "Ibuprofen",
    severity: "Critical",
    effect: "Severe Gastrointestinal & Systemic Bleeding",
    description: "Ibuprofen inhibits blood platelets and irritates stomach mucosal lining, amplifying Warfarin's blood thinning effects.",
    recommendation: "Avoid NSAIDs like Ibuprofen while taking Warfarin. Acetaminophen may be used for mild pain at low doses under supervision."
  },
  {
    drug1: "Sertraline",
    drug2: "Ibuprofen",
    severity: "Moderate",
    effect: "Increased Upper Gastrointestinal Bleeding",
    description: "SSRIs like Sertraline inhibit serotonin reuptake in platelets, which combined with NSAID stomach irritation increases bleeding risk.",
    recommendation: "Use with caution. Report any black tarry stools or unexplained bruising. Consider gastro-protective agent like Omeprazole if long-term."
  },
  {
    drug1: "Lisinopril",
    drug2: "Ibuprofen",
    severity: "Moderate",
    effect: "Reduced Antihypertensive Effect & Kidney Stress",
    description: "NSAIDs cause fluid retention and constrict renal blood vessels, counteracting Lisinopril's blood pressure lowering action and potentially impairing renal function.",
    recommendation: "Monitor blood pressure regularly. Avoid chronic daily use of NSAIDs if taking Lisinopril."
  },
  {
    drug1: "Omeprazole",
    drug2: "Atorvastatin",
    severity: "Mild",
    effect: "Potential Minor Increase in Statin Plasma Exposure",
    description: "Omeprazole may slightly alter liver enzyme CYP2C19 metabolization, potentially modestly increasing statin levels.",
    recommendation: "Generally clinically manageable. Monitor for unexpected muscle weakness or soreness."
  },
  {
    drug1: "Metoprolol",
    drug2: "Albuterol",
    severity: "Moderate",
    effect: "Antagonistic Effects on Bronchial and Cardiac Beta Receptors",
    description: "Non-selective beta blockers can block Albuterol's bronchodilating action, decreasing asthma rescue efficacy while Albuterol can increase heart rate.",
    recommendation: "Inform your doctor. Cardioselective beta blockers (like Metoprolol) are preferred, but bronchial monitoring is advised."
  },
  {
    drug1: "Acetaminophen",
    drug2: "Warfarin",
    severity: "Moderate (High Dose)",
    effect: "Elevated INR / Increased Anticoagulation",
    description: "Chronic high doses of Acetaminophen (>2,000mg/day for several days) can inhibit Warfarin metabolism, elevating INR blood thinning test results.",
    recommendation: "Occasional single doses are usually safe, but limit total daily intake to <2,000mg when on Warfarin."
  }
];

const SYMPTOM_KNOWLEDGE_BASE = {
  headache: {
    title: "Headache / Cephalgia",
    triageScore: "Low-Moderate",
    redFlags: ["Sudden severe 'thunderclap' onset", "Fever with stiff neck", "Confusion or vision loss", "Followed head trauma"],
    differentials: [
      { name: "Tension Headache", probability: "65%", status: "Common / Benign" },
      { name: "Migraine", probability: "25%", status: "Moderate / Manageable" },
      { name: "Sinus Headache", probability: "10%", status: "Common" }
    ],
    questions: [
      "Is the pain throbbing on one side or a constant tight band around the head?",
      "Are you experiencing nausea, sensitivity to light (photophobia), or sound?",
      "How long has this headache lasted?"
    ],
    advice: [
      "Stay hydrated (drink 500-1000ml water).",
      "Rest in a quiet, dimmed room.",
      "Consider OTC analgesics like Acetaminophen or Ibuprofen if not contraindicated.",
      "Apply a cold or warm compress to forehead or neck."
    ]
  },
  chest_pain: {
    title: "Chest Pain / Thoracic Discomfort",
    triageScore: "EMERGENCY / HIGH RISK",
    redFlags: ["Crushing pressure radiating to jaw, neck, or left arm", "Shortness of breath", "Profuse sweating (diaphoresis)", "Dizziness/lightheadedness"],
    differentials: [
      { name: "Acute Coronary Syndrome / Angina", probability: "High Risk", status: "Critical Emergency" },
      { name: "Gastroesophageal Reflux (GERD)", probability: "Moderate", status: "Non-Emergency" },
      { name: "Musculoskeletal Chest Wall Pain (Costochondritis)", probability: "Moderate", status: "Benign" }
    ],
    questions: [
      "Does the pain feel like a heavy weight resting on your chest?",
      "Does it get worse with deep inspiration or pressing on the chest wall?"
    ],
    advice: [
      "🚨 IF PAIN IS RADIATING OR ACCOMPANIED BY BREATHLESSNESS, CALL EMERGENCY 911 / 112 IMMEDIATELY.",
      "Do not attempt to drive yourself to the emergency room.",
      "Sit upright, remain calm, and unbutton tight clothing."
    ]
  },
  fever: {
    title: "Fever / Pyrexia",
    triageScore: "Moderate",
    redFlags: ["Temperature >103°F (39.4°C)", "Fever lasting >3 days", "Difficulty breathing", "Stiff neck or severe rash"],
    differentials: [
      { name: "Viral Upper Respiratory Infection (Flu/Cold)", probability: "60%", status: "Self-limiting" },
      { name: "Bacterial Infection (Strep, Urinary, Pulmonary)", probability: "30%", status: "Requires Evaluation" },
      { name: "Inflammatory Response", probability: "10%", status: "Monitor" }
    ],
    questions: [
      "What is your measured body temperature?",
      "Do you have a cough, sore throat, or urinary pain?"
    ],
    advice: [
      "Drink plentiful fluids (water, oral rehydration solution, herbal teas).",
      "Take antipyretics like Acetaminophen (325-500mg) or Ibuprofen (200-400mg) as appropriate.",
      "Get plenty of physical rest and wear lightweight clothing."
    ]
  },
  abdominal_pain: {
    title: "Abdominal Pain",
    triageScore: "Moderate-High",
    redFlags: ["Severe sharp pain localized to Right Lower Quadrant", "Vomiting blood or dark coffee-ground material", "High fever with rigid, hard abdomen", "Inability to keep fluids down"],
    differentials: [
      { name: "Gastroenteritis / Stomach Flu", probability: "45%", status: "Common" },
      { name: "Acid Indigestion / Gastritis", probability: "30%", status: "Manageable" },
      { name: "Acute Appendicitis / Gallbladder issue", probability: "15%", status: "Urgent Medical Care" }
    ],
    questions: [
      "Where specifically is the pain located (upper middle, lower right, left side)?",
      "Is the pain sharp and sudden or a dull cramping sensation?"
    ],
    advice: [
      "Sip clear liquids or peppermint tea.",
      "Avoid heavy, greasy, or spicy foods.",
      "Rest with a warm heating pad on abdomen.",
      "If pain migrates to lower right abdomen or worsens rapidly, seek urgent care."
    ]
  },
  cough: {
    title: "Cough / Respiratory Irritation",
    triageScore: "Low-Moderate",
    redFlags: ["Coughing up pink frothy sputum or bright red blood", "Stridor or severe gasping for air", "High fever with chills"],
    differentials: [
      { name: "Acute Viral Bronchitis / Cold", probability: "70%", status: "Self-limiting" },
      { name: "Allergic Rhinitis / Post-nasal drip", probability: "20%", status: "Common" },
      { name: "Pneumonia or Asthma flare", probability: "10%", status: "Medical Review" }
    ],
    questions: [
      "Is the cough dry or productive with phlegm/mucus?",
      "Do you have a history of asthma or allergies?"
    ],
    advice: [
      "Use honey (1-2 teaspoons) for cough soothing (adults and children >1 yr).",
      "Use a steam inhaler or hot shower to humidify airways.",
      "Stay hydrated to thin bronchial secretions."
    ]
  }
};

const BODY_REGIONS = [
  {
    id: "head",
    name: "Head & Neck",
    icon: "🧠",
    symptoms: ["Headache", "Dizziness / Vertigo", "Sore Throat", "Neck Stiffness", "Vision Changes", "Earache"]
  },
  {
    id: "chest",
    name: "Chest & Respiratory",
    icon: "🫁",
    symptoms: ["Chest Pressure / Pain", "Shortness of Breath", "Persistent Cough", "Palpitations", "Wheezing"]
  },
  {
    id: "abdomen",
    name: "Abdomen & GI",
    icon: "🩺",
    symptoms: ["Stomach Cramps", "Nausea / Vomiting", "Acid Reflux / Heartburn", "Bloating", "Diarrhea", "Constipation"]
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal & Joints",
    icon: "🦴",
    symptoms: ["Lower Back Pain", "Joint Stiffness / Swelling", "Muscle Spasms", "Shoulder Strain", "Knee Discomfort"]
  },
  {
    id: "skin",
    name: "Skin & Dermatological",
    icon: "🩸",
    symptoms: ["Rash or Hives", "Itching", "Unexplained Bruising", "Skin Lesion / Mole Change", "Dry Scaly Patches"]
  },
  {
    id: "mental",
    name: "Mental Health & Neurological",
    icon: "💭",
    symptoms: ["Anxiety & Panic", "Depressed Mood", "Insomnia / Sleep Disturbance", "Brain Fog / Memory Trouble", "Tremors"]
  }
];

const QUICK_PROMPTS = [
  { label: "💊 Check Drug Interaction", query: "Can I take Aspirin and Ibuprofen together?" },
  { label: "🩺 Symptom Analysis", query: "I have a severe headache, mild fever, and sensitive eyes." },
  { label: "🫀 Chest Pain Triage", query: "I am experiencing tightness in my chest when I exercise." },
  { label: "🌿 GERD & Acid Reflux", query: "What are safe treatments and dietary steps for acid reflux?" },
  { label: "😴 Insomnia & Anxiety", query: "How can I manage acute sleep disturbance and anxiety without habit-forming drugs?" }
];

// Helper functions for drug interactions and triage logic
function checkDrugInteractions(drugList) {
  if (!drugList || drugList.length < 2) return [];
  const foundInteractions = [];

  for (let i = 0; i < drugList.length; i++) {
    for (let j = i + 1; j < drugList.length; j++) {
      const d1 = drugList[i].toLowerCase();
      const d2 = drugList[j].toLowerCase();

      DRUG_INTERACTIONS.forEach(inter => {
        const i1 = inter.drug1.toLowerCase();
        const i2 = inter.drug2.toLowerCase();

        if ((d1.includes(i1) && d2.includes(i2)) || (d1.includes(i2) && d2.includes(i1))) {
          foundInteractions.push(inter);
        }
      });
    }
  }

  return foundInteractions;
}

function detectRedFlags(userText) {
  const lower = userText.toLowerCase();
  return RED_FLAG_KEYWORDS.filter(kw => lower.includes(kw));
}
