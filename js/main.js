// จัดการการส่งฟอร์มแจ้งเบาะแส
const reportForm = document.getElementById("report-form");
if (reportForm) {
  reportForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;
    const image = document.getElementById("image").files[0];

    const formData = new FormData();
    formData.append("name", name);
    formData.append("location", location);
    formData.append("description", description);
    if (image) formData.append("image", image);

    fetch("https://your-api-url.amazonaws.com/report", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      alert("ส่งข้อมูลสำเร็จ");
      reportForm.reset();
    })
    .catch(error => {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    });
  });
}

// ค้นหาเคสผู้สูญหาย
function searchCase() {
  const keyword = document.getElementById("search-input").value;

  fetch(`https://your-api-url.amazonaws.com/search?keyword=${encodeURIComponent(keyword)}`)
    .then(response => response.json())
    .then(data => {
      const resultsDiv = document.getElementById("search-results");
      resultsDiv.innerHTML = "";

      if (data.length === 0) {
        resultsDiv.innerHTML = "<p>ไม่พบเคสที่ตรงกับคำค้น</p>";
        return;
      }

      data.forEach(item => {
        const div = document.createElement("div");
        div.className = "case-result";
        div.innerHTML = `
          <h3>${item.name}</h3>
          <p><strong>สถานที่:</strong> ${item.location}</p>
          <p>${item.description}</p>
          <p><strong>สถานะ:</strong> ${item.status}</p>
        `;
        resultsDiv.appendChild(div);
      });
    })
    .catch(error => {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการค้นหา");
    });
}

// ตรวจสอบสถานะจาก Case ID
function checkStatus() {
  const caseId = document.getElementById("status-code").value;
  fetch(`https://your-api-url.amazonaws.com/status?id=${encodeURIComponent(caseId)}`)
    .then(response => response.json())
    .then(data => {
      const statusDiv = document.getElementById("status-result");
      if (data.status) {
        statusDiv.innerHTML = `<p><strong>สถานะของเคส:</strong> ${data.status}</p>`;
      } else {
        statusDiv.innerHTML = `<p>ไม่พบเคสที่ตรงกับรหัสนี้</p>`;
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("ไม่สามารถดึงสถานะได้ กรุณาลองใหม่");
    });
}
