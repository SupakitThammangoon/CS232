// main.js

// เปลี่ยนเป็น Stage ปัจจุบันของคุณ
const BASE = 'https://eq5e94vkxd.execute-api.us-east-1.amazonaws.com/Final';

document.addEventListener('DOMContentLoaded', () => {
  // 1) ไฮไลต์เมนู active ตามหน้า
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('nav.navbar a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === current);
  });

  // 2) ผูกฟอร์มแจ้งเบาะแส (POST /tips)
  const reportForm = document.getElementById('report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', handleReportTip);
  }


    const searchBtn = document.getElementById('search-tips-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const id = document.getElementById('search-case-id').value.trim();
        if (!id) {
          alert('กรุณากรอกเลขรหัสเคสเพื่อค้นหา');
          return;
        }
        loadTips(id);
      });
    }
  
  

  // 4) ผูกปุ่มตรวจสถานะเคส (GET /check-status)
  const statusBtn = document.getElementById('status-btn');
  if (statusBtn) {
    statusBtn.addEventListener('click', checkStatus);
  }
});


// === ส่งเบาะแส (POST /tips) ===
async function handleReportTip(e) {
  e.preventDefault();

  const case_id         = document.getElementById('case-id').value.trim();
  const tipper_name     = document.getElementById('tipper-name').value.trim();
  const tipper_contact  = document.getElementById('tipper-contact').value.trim();
  const tip_location    = document.getElementById('location').value.trim();
  const tip_description = document.getElementById('description').value.trim();
  const imageFile       = document.getElementById('image').files[0];

  let photo_url = null;

  try {
    // 1) ถ้ามีรูป ให้ขอ pre-signed URL แล้วอัปโหลด
    if (imageFile) {
      const filename    = `${Date.now()}-${imageFile.name}`;
      const contentType = imageFile.type;

      // ขอ pre-signed URL
      const presignRes = await fetch(
        `${BASE}/get-upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, contentType })
        }
      );
      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, fileUrl } = await presignRes.json();

      // อัปโหลดไฟล์ไป S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: imageFile
      });
      if (!uploadRes.ok) throw new Error('Failed to upload file');

      photo_url = fileUrl;
    }

    // 2) ส่งข้อมูลเบาะแส
    const res = await fetch(`${BASE}/tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id,
        tipper_name,
        tipper_contact,
        tip_location,
        tip_description,
        photo_url
      })
    });
    const j = await res.json();
    if (!res.ok || !j.success) {
      console.error('POST /tips failed:', res.status, j);
      throw new Error('Submit tip failed');
    }

    alert('ส่งเบาะแสสำเร็จ');
    e.target.reset();
    // โหลดเบาะแสใหม่อัตโนมัติ

  } catch (err) {
    console.error('Error in handleReportTip:', err);
    alert('เกิดข้อผิดพลาดในการส่งเบาะแส');
  }
}


// === ดึงเบาะแส (GET /tips?case_id=...) ===
async function loadTips(case_id) {
  const container = document.getElementById('tips-container');
  container.innerHTML = '<p>กำลังโหลดเบาะแส…</p>';

  try {
    const res  = await fetch(`${BASE}/tips?case_id=${encodeURIComponent(case_id)}`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p>ยังไม่มีเบาะแสสำหรับเคสนี้</p>';
      return;
    }

    container.innerHTML = '';
    data.forEach(tip => {
      const div = document.createElement('div');
      div.className = 'tip-card';

      // ใช้รูปเคสจาก MissingPersons
      const imgHtml = tip.case_photo_url
        ? `<img src="${tip.case_photo_url}" class="tip-img" alt="รูปเคส ${tip.case_id}" />`
        : '';

      div.innerHTML = `
        ${imgHtml}
        <p><strong>รหัสเคส:</strong> ${tip.case_id}</p>
        <p><strong>ผู้แจ้ง:</strong> ${tip.tipper_name}</p>
        <p><strong>สถานที่:</strong> ${tip.tip_location}</p>
        <p><strong>รายละเอียด:</strong> ${tip.tip_description || '-'}</p>
        <button class="btn-delete-tip" data-tip-id="${tip.tip_id}">ลบ
      `;

      const deleteBtn = div.querySelector('.btn-delete-tip');
deleteBtn.addEventListener('click', async () => {
  if (!confirm('ยืนยันลบเบาะแสนี้?')) return;
  try {
    const res = await fetch(
      `${BASE}/tips/${deleteBtn.dataset.tipId}`,
      { method: 'DELETE' }
    );
    const json = await res.json();
    if (res.ok && json.success) {
      alert('ลบเบาะแสสำเร็จ');
      loadTips(case_id);  // โหลดใหม่
    } else {
      alert('ลบไม่สำเร็จ: ' + (json.message || res.status));
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการลบเบาะแส');
  }
});

      container.appendChild(div);
    });
  } catch (err) {
    console.error('Error in loadTips:', err);
    container.innerHTML = '<p>โหลดเบาะแสล้มเหลว</p>';
  }
}



// === ตรวจสอบสถานะเคส (GET /check-status?id=...) ===
async function checkStatus() {
  const caseId = document.getElementById('status-code').value.trim();
  if (!caseId) {
    alert('กรุณากรอกรหัสเคส');
    return;
  }

  const out = document.getElementById('status-result');
  out.innerHTML = '<p>กำลังตรวจสอบ…</p>';

  try {
    const res = await fetch(`${BASE}/check-status?id=${encodeURIComponent(caseId)}`);
    if (!res.ok) throw new Error('Status ' + res.status);

    const { status } = await res.json();
    const map = { MISSING: 'ยังไม่พบ', FOUND: 'พบตัวแล้ว' };
    out.innerHTML = `<p>สถานะของเคส: ${map[status] || status}</p>`;

  } catch (err) {
    console.error('Error in checkStatus:', err);
    out.innerHTML = '<p>ไม่สามารถดึงสถานะได้</p>';
  }
}
