document.addEventListener("DOMContentLoaded", () => {
  loadCases(); // โหลดเคสทั้งหมดเมื่อเปิดหน้า
  
  document.getElementById("case-form").addEventListener("submit", handleSubmit);
});

async function handleSubmit(event) {
  event.preventDefault();

  const full_name = document.getElementById("full-name").value;
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const last_seen_date = document.getElementById("last-seen-date").value;
  const last_seen_location = document.getElementById("last-seen-location").value;
  const description = document.getElementById("description").value;
  const photoFile = document.getElementById("photo").files[0];

  let photo_base64 = "";
  if (photoFile) {
    photo_base64 = await toBase64(photoFile);
  }

  const body = {
    full_name,
    age,
    gender,
    last_seen_date,
    last_seen_location,
    description,
    photo_base64
  };

  fetch("https://eq5e94vkxd.execute-api.us-east-1.amazonaws.com/second/add-missing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then((res) => res.json())
    .then((data) => {
      alert("แจ้งเคสเรียบร้อยแล้ว");
      document.getElementById("case-form").reset();
      loadCases(); // โหลดรายการใหม่หลังเพิ่มเคส
    })
    .catch((error) => {
      console.error("เกิดข้อผิดพลาด:", error);
      alert("ไม่สามารถส่งข้อมูลได้");
    });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function loadCases() {
  fetch("https://eq5e94vkxd.execute-api.us-east-1.amazonaws.com/second/get-all-cases")
    .then((res) => res.json())
    .then((cases) => {
      const listDiv = document.getElementById("case-list");
      listDiv.innerHTML = "";

      if (!cases || cases.length === 0) {
        listDiv.innerHTML = "<p>ยังไม่มีเคสผู้สูญหาย</p>";
        return;
      }

      cases.forEach((item) => {
        const div = document.createElement("div");
        div.className = "case-card";
        div.innerHTML = `
          <img src="${item.photo_url || '../img/default.jpg'}" class="person-img" />
          <div>
            <h3>${item.full_name}</h3>
            <p><strong>เพศ:</strong> ${item.gender}</p>
            <p><strong>อายุ:</strong> ${item.age}</p>
            <p><strong>สถานที่หาย:</strong> ${item.last_seen_location}</p>
            <p><strong>วันที่หาย:</strong> ${item.last_seen_date}</p>
            <p><strong>สถานะ:</strong> ${item.status}</p>
          </div>
        `;
        listDiv.appendChild(div);
      });
    })
    .catch((error) => {
      console.error("โหลดเคสล้มเหลว:", error);
    });
}
