/**
 * MediPulse AI - Core Application Controller
 */

// Application State
let activeTab = "tab-chat";
let isRecording = false;
let speechRecognition = null;
let patientCabinet = [
  { id: "med-1", name: "Aspirin", genericName: "Acetylsalicylic Acid", dosage: "81mg daily" },
  { id: "med-4", name: "Lisinopril", genericName: "Lisinopril", dosage: "10mg daily" }
];
let selectedBodyRegion = null;
let currentVitals = { bpm: 72, sys: 120, dia: 80, spo2: 98, temp: 98.6 };
let chatHistory = [];

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  renderQuickPrompts();
  populateMedsDatalist();
  renderCabinetList();
  renderCabinetCheckboxes();
  renderBodyRegions();
  initVoiceRecognition();
});

// Tab Switching System
function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-tab-btn").forEach(el => el.classList.remove("active"));

  const targetTab = document.getElementById(tabId);
  const targetNav = document.getElementById("nav-" + tabId);

  if (targetTab) targetTab.classList.add("active");
  if (targetNav) targetNav.classList.add("active");
}

// Dark / Light Theme Toggle
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  const btn = document.getElementById("themeToggleBtn");
  btn.innerHTML = newTheme === "dark" ? "<span>🌙</span>" : "<span>☀️</span>";
}

// -------------------------------------------------------------
// CHATBOT ENGINE & VOICE SYSTEM
// -------------------------------------------------------------

function renderQuickPrompts() {
  const container = document.getElementById("quickPromptsContainer");
  if (!container) return;
  container.innerHTML = QUICK_PROMPTS.map(p => `
    <button class="prompt-chip" onclick="useQuickPrompt('${p.query.replace(/'/g, "\\'")}')">
      ${p.label}
    </button>
  `).join('');
}

function useQuickPrompt(text) {
  document.getElementById("userInput").value = text;
  sendMessage();
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
}

function sendMessage() {
  const inputEl = document.getElementById("userInput");
  const text = inputEl.value.trim();
  if (!text) return;

  // Render User Message
  appendChatMessage(text, "user");
  inputEl.value = "";

  // Check for Emergency Red Flags
  const redFlags = detectRedFlags(text);
  if (redFlags.length > 0) {
    showEmergencyAlert(redFlags);
  }

  // Simulate AI Clinical Processing
  setTimeout(() => {
    generateAIResponse(text, redFlags);
  }, 600);
}

function appendChatMessage(content, sender, cardHtml = "") {
  const area = document.getElementById("messagesArea");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}-msg`;

  const avatar = sender === "user" ? "👤" : "🩺";
  const speechBtn = sender === "ai" ? `<button style="background:none; border:none; cursor:pointer; font-size:0.8rem; margin-left:8px;" onclick="speakText(this)" title="Read Aloud">🔊</button>` : "";

  bubble.innerHTML = `
    <div class="avatar-icon">${avatar}</div>
    <div class="bubble-content">
      ${content} ${speechBtn}
      ${cardHtml}
    </div>
  `;

  area.appendChild(bubble);
  area.scrollTop = area.scrollHeight;

  // Log to history
  chatHistory.push({ sender, text: content, timestamp: new Date().toLocaleTimeString() });
}

function generateAIResponse(userText, redFlags) {
  const lower = userText.toLowerCase();

  // Drug Interaction query detection
  const detectedMedsInQuery = MEDICATIONS_DATABASE.filter(m => 
    lower.includes(m.name.toLowerCase()) || lower.includes(m.genericName.toLowerCase())
  );

  let responseHtml = "";
  let responseText = "";

  if (redFlags.length > 0) {
    responseText = `⚠️ **CRITICAL RED FLAG DETECTED**: Your query mentions "${redFlags.join(", ")}". This requires immediate emergency medical evaluation.`;
    responseHtml = `
      <div class="response-card" style="border-color: #ef4444; background: rgba(239,68,68,0.1);">
        <div class="response-header">
          <strong style="color: #fca5a5;">EMERGENCY RED FLAG ALERT</strong>
          <span class="triage-badge emergency">Immediate Emergency</span>
        </div>
        <p style="font-size:0.85rem; color:#fecaca; margin-bottom:8px;">Symptoms like <strong>${redFlags.join(", ")}</strong> can indicate cardiovascular, respiratory, or neurological emergencies.</p>
        <ul class="action-checklist">
          <li>Call Emergency 911 or proceed to the nearest Emergency Department immediately.</li>
          <li>Do not drive yourself. Stay calm and sit in a comfortable position.</li>
        </ul>
      </div>
    `;
    appendChatMessage(responseText, "ai", responseHtml);
    return;
  }

  // Drug Interaction query handling
  if (detectedMedsInQuery.length >= 2) {
    const medNames = detectedMedsInQuery.map(m => m.name);
    const interactions = checkDrugInteractions(medNames);

    if (interactions.length > 0) {
      responseText = `I detected a query regarding **${medNames.join(" and ")}**. Here is the clinical interaction breakdown:`;
      responseHtml = interactions.map(inter => `
        <div class="response-card" style="border-color: ${inter.severity === 'Critical' ? '#ef4444' : '#f59e0b'};">
          <div class="response-header">
            <strong>Pharmacological Interaction: ${inter.drug1} + ${inter.drug2}</strong>
            <span class="triage-badge ${inter.severity === 'Critical' ? 'emergency' : 'warning'}">${inter.severity} Risk</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;"><strong>Effect:</strong> ${inter.effect}</p>
          <p style="font-size:0.82rem; color:var(--text-muted);">${inter.description}</p>
          <div style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; font-size:0.8rem; color:var(--accent-cyan);">
            💡 <strong>Recommendation:</strong> ${inter.recommendation}
          </div>
        </div>
      `).join('');
    } else {
      responseText = `I analyzed **${medNames.join(" and ")}**. No major documented clinical interactions were found between these specific agents.`;
      responseHtml = `
        <div class="response-card">
          <div class="response-header">
            <strong>No Severe Interactions Found</strong>
            <span class="triage-badge safe">Low Risk</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted);">Standard recommended dosages may be used if prescribed by your physician. Always take as directed.</p>
        </div>
      `;
    }
    appendChatMessage(responseText, "ai", responseHtml);
    return;
  }

  // Symptom matching in Knowledge Base
  let matchedSymptomKey = null;
  if (lower.includes("headache") || lower.includes("migraine")) matchedSymptomKey = "headache";
  else if (lower.includes("chest") || lower.includes("heart pain")) matchedSymptomKey = "chest_pain";
  else if (lower.includes("fever") || lower.includes("high temp")) matchedSymptomKey = "fever";
  else if (lower.includes("stomach") || lower.includes("abdominal")) matchedSymptomKey = "abdominal_pain";
  else if (lower.includes("cough") || lower.includes("bronchitis")) matchedSymptomKey = "cough";

  if (matchedSymptomKey && SYMPTOM_KNOWLEDGE_BASE[matchedSymptomKey]) {
    const sysData = SYMPTOM_KNOWLEDGE_BASE[matchedSymptomKey];
    responseText = `Based on your mention of **${sysData.title}**, here is the preliminary triage evaluation:`;

    const diffsHtml = sysData.differentials.map(d => `
      <div class="diff-item">
        <span>${d.name} <small style="color:var(--text-muted);">(${d.status})</small></span>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${d.probability};"></div></div>
          <span style="font-size:0.75rem; font-weight:700;">${d.probability}</span>
        </div>
      </div>
    `).join('');

    const adviceHtml = sysData.advice.map(a => `<li>${a}</li>`).join('');

    responseHtml = `
      <div class="response-card">
        <div class="response-header">
          <strong>${sysData.title} Assessment</strong>
          <span class="triage-badge ${sysData.triageScore.includes('EMERGENCY') ? 'emergency' : 'moderate'}">${sysData.triageScore}</span>
        </div>
        
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-top:8px;">POSSIBLE DIFFERENTIAL DIAGNOSES:</div>
        <div class="differential-list">${diffsHtml}</div>

        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-top:10px;">RECOMMENDED ACTIONS:</div>
        <ul class="action-checklist">${adviceHtml}</ul>
      </div>
    `;

    appendChatMessage(responseText, "ai", responseHtml);
    return;
  }

  // General fallback response
  responseText = `Thank you for sharing your symptoms. Based on your current health context (Age: 34, Allergy: Penicillin, Active Meds: Lisinopril), here is general clinical guidance:`;
  responseHtml = `
    <div class="response-card">
      <div class="response-header">
        <strong>General Health Assessment</strong>
        <span class="triage-badge safe">Informational</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">Monitor your symptoms over the next 24-48 hours. Ensure adequate hydration, rest, and track any changes in your vital signs.</p>
      <ul class="action-checklist">
        <li>Try our <strong>Body & Symptom Visualizer</strong> tab to isolate specific body regions.</li>
        <li>Check the <strong>Medication Tracker</strong> tab to ensure your active prescriptions don't conflict.</li>
        <li>If symptoms escalate, seek evaluation from your primary care provider.</li>
      </ul>
    </div>
  `;
  appendChatMessage(responseText, "ai", responseHtml);
}

// Voice Speech Input (Web Speech API)
function initVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById("userInput").value = transcript;
      toggleVoiceInput();
      sendMessage();
    };

    speechRecognition.onerror = () => toggleVoiceInput();
  }
}

function toggleVoiceInput() {
  const btn = document.getElementById("micBtn");
  if (!speechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  if (isRecording) {
    speechRecognition.stop();
    isRecording = false;
    btn.classList.remove("recording");
  } else {
    speechRecognition.start();
    isRecording = true;
    btn.classList.add("recording");
  }
}

function speakText(btnElement) {
  const textContent = btnElement.parentElement.innerText;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(textContent);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function showEmergencyAlert(redFlags) {
  const modal = document.getElementById("emergencyModal");
  const modalText = document.getElementById("emergencyModalText");
  modalText.innerHTML = `Your query included critical red-flag terms: <strong>"${redFlags.join(", ")}"</strong>. Please seek emergency medical care immediately!`;
  modal.classList.add("active");
}

function clearChatHistory() {
  if (confirm("Clear all current chat history?")) {
    document.getElementById("messagesArea").innerHTML = `
      <div class="chat-bubble ai-msg">
        <div class="avatar-icon">🩺</div>
        <div class="bubble-content">Chat history cleared. How can MediPulse AI assist you now?</div>
      </div>
    `;
    chatHistory = [];
  }
}

// -------------------------------------------------------------
// MEDICATION & DRUG INTERACTION TRACKER
// -------------------------------------------------------------

function populateMedsDatalist() {
  const datalist = document.getElementById("medsDatalist");
  if (!datalist) return;
  datalist.innerHTML = MEDICATIONS_DATABASE.map(m => `
    <option value="${m.name}">${m.genericName} (${m.category})</option>
  `).join('');
}

function addMedicationFromInput() {
  const nameInput = document.getElementById("medSearchInput");
  const dosageInput = document.getElementById("medDosageInput");

  const name = nameInput.value.trim();
  const dosage = dosageInput.value.trim() || "Standard Dose";

  if (!name) return;

  const foundDbMed = MEDICATIONS_DATABASE.find(m => m.name.toLowerCase() === name.toLowerCase());

  const newMed = {
    id: "med-" + Date.now(),
    name: foundDbMed ? foundDbMed.name : name,
    genericName: foundDbMed ? foundDbMed.genericName : name,
    dosage: dosage
  };

  patientCabinet.push(newMed);
  nameInput.value = "";
  dosageInput.value = "";

  renderCabinetList();
  renderCabinetCheckboxes();
  checkCabinetInteractions();
}

function deleteCabinetItem(medId) {
  patientCabinet = patientCabinet.filter(m => m.id !== medId);
  renderCabinetList();
  renderCabinetCheckboxes();
  checkCabinetInteractions();
}

function renderCabinetList() {
  const container = document.getElementById("cabinetListContainer");
  const countEl = document.getElementById("cabinetCount");
  if (!container) return;

  countEl.innerText = patientCabinet.length;

  if (patientCabinet.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No active prescriptions in your cabinet.</p>`;
    return;
  }

  container.innerHTML = patientCabinet.map(item => `
    <div class="cabinet-item">
      <div class="cabinet-item-info">
        <h4>${item.name}</h4>
        <p>${item.genericName} • ${item.dosage}</p>
      </div>
      <button class="delete-med-btn" onclick="deleteCabinetItem('${item.id}')">Remove</button>
    </div>
  `).join('');
}

function renderCabinetCheckboxes() {
  const container = document.getElementById("interactionCheckboxes");
  if (!container) return;

  container.innerHTML = MEDICATIONS_DATABASE.map(med => {
    const isChecked = patientCabinet.some(p => p.name.toLowerCase() === med.name.toLowerCase());
    return `
      <label style="font-size:0.82rem; display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" value="${med.name}" class="drug-checkbox" ${isChecked ? 'checked' : ''}>
        ${med.name} <small style="color:var(--text-muted);">(${med.category})</small>
      </label>
    `;
  }).join('');
}

function checkCabinetInteractions() {
  const cabinetNames = patientCabinet.map(m => m.name);
  const interactions = checkDrugInteractions(cabinetNames);
  displayInteractionAlerts(interactions, "Prescription Cabinet Scan");
}

function analyzeSelectedInteractions() {
  const checkedEls = document.querySelectorAll(".drug-checkbox:checked");
  const selectedNames = Array.from(checkedEls).map(el => el.value);

  if (selectedNames.length < 2) {
    alert("Please select at least 2 medications to run interaction analysis.");
    return;
  }

  const interactions = checkDrugInteractions(selectedNames);
  displayInteractionAlerts(interactions, "Selected Multi-Drug Scan");
}

function displayInteractionAlerts(interactions, scanTitle) {
  const outputEl = document.getElementById("interactionAlertOutput");
  if (!outputEl) return;

  outputEl.style.display = "block";

  if (interactions.length === 0) {
    outputEl.innerHTML = `
      <div class="interaction-alert-box" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.4);">
        <div class="interaction-alert-header" style="color: #34d399;">
          <span>✓</span> <strong>${scanTitle}: Safe - No Severe Conflicts Detected</strong>
        </div>
        <p style="font-size:0.82rem; color:var(--text-muted);">No major contraindications were identified among the analyzed medications. Always verify with your pharmacist.</p>
      </div>
    `;
    return;
  }

  outputEl.innerHTML = interactions.map(inter => `
    <div class="interaction-alert-box">
      <div class="interaction-alert-header">
        <span>⚠️</span> <strong>${scanTitle}: ${inter.severity} Hazard Identified!</strong>
      </div>
      <div style="font-size:0.9rem; font-weight:700; color:white; margin-bottom:4px;">
        ${inter.drug1} ⚡ ${inter.drug2}
      </div>
      <p style="font-size:0.83rem; color:#fecaca; margin-bottom:6px;"><strong>Clinical Effect:</strong> ${inter.effect}</p>
      <p style="font-size:0.8rem; color:var(--text-muted);">${inter.description}</p>
      <div style="margin-top:8px; padding:6px 10px; background:rgba(0,0,0,0.3); border-radius:6px; font-size:0.78rem; color:var(--accent-cyan);">
        💡 <strong>Clinical Guidance:</strong> ${inter.recommendation}
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// BODY VISUALIZER & SYMPTOM ASSESSMENT
// -------------------------------------------------------------

function renderBodyRegions() {
  const container = document.getElementById("bodyRegionsContainer");
  if (!container) return;

  container.innerHTML = BODY_REGIONS.map(reg => `
    <div class="body-region-card ${selectedBodyRegion === reg.id ? 'selected' : ''}" onclick="selectBodyRegion('${reg.id}')">
      <div class="body-region-icon">${reg.icon}</div>
      <div style="font-weight:600; font-size:0.9rem;">${reg.name}</div>
    </div>
  `).join('');
}

function selectBodyRegion(regionId) {
  selectedBodyRegion = regionId;
  renderBodyRegions();

  const regObj = BODY_REGIONS.find(r => r.id === regionId);
  const checklistContainer = document.getElementById("symptomsChecklistContainer");

  if (!regObj || !checklistContainer) return;

  checklistContainer.innerHTML = regObj.symptoms.map(sym => `
    <label style="background:rgba(255,255,255,0.05); border:1px solid var(--panel-border); padding:6px 12px; border-radius:var(--radius-full); font-size:0.82rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
      <input type="checkbox" value="${sym}" class="symptom-visual-cb">
      ${sym}
    </label>
  `).join('');
}

function updatePainLabel(val) {
  const label = document.getElementById("painValueLabel");
  let status = "Mild";
  let color = "var(--severity-safe)";

  if (val >= 4 && val <= 6) {
    status = "Moderate";
    color = "var(--severity-warning)";
  } else if (val >= 7) {
    status = "Severe / Acute";
    color = "var(--severity-emergency)";
  }

  label.style.color = color;
  label.innerText = `${val} / 10 (${status})`;
}

function generateTriageFromVisualizer() {
  const checkedSymptoms = Array.from(document.querySelectorAll(".symptom-visual-cb:checked")).map(c => c.value);
  const painVal = document.getElementById("painSlider").value;
  const resultBox = document.getElementById("triageResultContent");

  if (checkedSymptoms.length === 0) {
    alert("Please select at least one symptom from the checklist.");
    return;
  }

  let triageLevel = "Moderate";
  let badgeClass = "warning";
  if (painVal >= 8 || checkedSymptoms.includes("Chest Pressure / Pain") || checkedSymptoms.includes("Shortness of Breath")) {
    triageLevel = "EMERGENCY / URGENT";
    badgeClass = "emergency";
  } else if (painVal <= 3) {
    triageLevel = "Low Risk / Self-Care";
    badgeClass = "safe";
  }

  resultBox.innerHTML = `
    <div class="response-header" style="margin-bottom:12px;">
      <strong>Assessment Summary</strong>
      <span class="triage-badge ${badgeClass}">${triageLevel}</span>
    </div>
    <p style="font-size:0.85rem; margin-bottom:8px;"><strong>Selected Symptoms:</strong> ${checkedSymptoms.join(", ")}</p>
    <p style="font-size:0.85rem; margin-bottom:12px;"><strong>Pain Intensity:</strong> ${painVal} / 10</p>
    
    <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:8px; margin-bottom:12px;">
      <strong style="color:var(--accent-cyan); font-size:0.85rem;">Clinical Guidance:</strong>
      <ul class="action-checklist" style="margin-top:6px;">
        ${triageLevel.includes('EMERGENCY') ? 
          '<li>Seek immediate evaluation at Urgent Care or Emergency Room.</li>' : 
          '<li>Rest, maintain hydration, and monitor symptoms over 24 hrs.</li>'}
        <li>Schedule a follow-up with your primary physician if symptoms persist beyond 48 hrs.</li>
      </ul>
    </div>

    <button class="icon-btn" style="width:100%; justify-content:center; background:var(--accent-blue); color:white; border:none;" onclick="switchTab('tab-chat'); useQuickPrompt('I am feeling ${checkedSymptoms.join(", ")} with a pain level of ${painVal}/10.')">
      💬 Discuss with AI Chatbot
    </button>
  `;
}

// -------------------------------------------------------------
// VITALS & REPORT GENERATOR
// -------------------------------------------------------------

function saveVitalsLog() {
  const bpm = document.getElementById("inputBpm").value;
  const sys = document.getElementById("inputSys").value;
  const dia = document.getElementById("inputDia").value;
  const spo2 = document.getElementById("inputSpo2").value;
  const temp = document.getElementById("inputTemp").value;

  if (bpm) {
    currentVitals.bpm = bpm;
    document.getElementById("valHeartRate").innerHTML = `${bpm} <span style="font-size:0.9rem;">BPM</span>`;
    document.getElementById("miniBpm").innerText = `${bpm} BPM`;
  }
  if (sys && dia) {
    currentVitals.sys = sys;
    currentVitals.dia = dia;
    document.getElementById("valBp").innerHTML = `${sys}/${dia} <span style="font-size:0.9rem;">mmHg</span>`;
    document.getElementById("miniBp").innerText = `${sys}/${dia}`;
  }
  if (spo2) {
    currentVitals.spo2 = spo2;
    document.getElementById("valSpo2").innerHTML = `${spo2} <span style="font-size:0.9rem;">%</span>`;
    document.getElementById("miniSpo2").innerText = `${spo2}%`;
  }
  if (temp) {
    currentVitals.temp = temp;
    document.getElementById("valTemp").innerHTML = `${temp} <span style="font-size:0.9rem;">°F</span>`;
    document.getElementById("miniTemp").innerText = `${temp}°F`;
  }

  alert("Vitals record updated successfully!");
}

function openReportModal() {
  const modal = document.getElementById("reportModal");
  const area = document.getElementById("reportPrintArea");

  const medsText = patientCabinet.length > 0 ? patientCabinet.map(m => `• ${m.name} (${m.dosage})`).join('<br>') : "No active prescriptions logged.";
  const vitalsText = `Heart Rate: ${currentVitals.bpm} BPM | BP: ${currentVitals.sys}/${currentVitals.dia} mmHg | SpO2: ${currentVitals.spo2}% | Temp: ${currentVitals.temp}°F`;

  area.innerHTML = `
    <div style="border-bottom:2px solid var(--accent-cyan); padding-bottom:8px; margin-bottom:12px;">
      <h2 style="color:var(--accent-cyan);">MediPulse AI Patient Health Summary</h2>
      <p style="font-size:0.8rem; color:var(--text-muted);">Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div style="margin-bottom:12px;">
      <strong>Patient Profile:</strong> Alex Mercer (Male, 34 yrs)<br>
      <strong>Known Allergies:</strong> Penicillin<br>
      <strong>Pre-existing Conditions:</strong> Mild Asthma
    </div>

    <div style="margin-bottom:12px; background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
      <strong>Biometric Vitals Snapshot:</strong><br>
      ${vitalsText}
    </div>

    <div style="margin-bottom:12px;">
      <strong>Active Prescriptions & Cabinet:</strong><br>
      ${medsText}
    </div>

    <div>
      <strong>Recent Triage Consultation Log:</strong><br>
      ${chatHistory.length > 0 ? chatHistory.slice(-4).map(h => `<div style="font-size:0.82rem; margin-top:4px;"><strong>[${h.sender.toUpperCase()} ${h.timestamp}]:</strong> ${h.text}</div>`).join('') : 'No recent chat transcript logged.'}
    </div>
  `;

  modal.classList.add("active");
}

function closeReportModal() {
  document.getElementById("reportModal").classList.remove("active");
}
