// missing.js

// 1) Define your API base URL once
const BASE = 'https://eq5e94vkxd.execute-api.us-east-1.amazonaws.com/Final';


document.addEventListener('DOMContentLoaded', () => {
  // 2) Highlight active menu item
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('nav.navbar a').forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    link.classList.toggle('active', linkPage === currentPage);
  });

  // 3) Attach submit handler
  const missingForm = document.getElementById('missing-form');
  if (missingForm) {
    missingForm.addEventListener('submit', handleSubmitMissing);
  }

  // 4) Load existing cases
  loadExistingCases();
});



async function handleSubmitMissing(event) {
  event.preventDefault();

  const photoFile = document.getElementById('photo').files[0];
  const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

  // 1) ตรวจสอบขนาดไฟล์ก่อนเลย
  if (photoFile && photoFile.size > MAX_SIZE) {
    alert('ขนาดรูปภาพต้องไม่เกิน 25 MB กรุณาเลือกไฟล์ใหม่');
    return;
  }

  const reporterInput      = document.getElementById('reporter-id');
  const reporter_id        = reporterInput ? reporterInput.value : null;
  const full_name          = document.getElementById('full-name').value.trim();
  const age                = Number(document.getElementById('age').value);
  const gender             = document.getElementById('gender').value;
  const last_seen_date     = document.getElementById('missing-date').value;
  const last_seen_location = document.getElementById('last-seen').value.trim();
  const description        = document.getElementById('details').value.trim();
  

  let photo_url = null;

  try {
    if (photoFile) {
      const filename    = `${Date.now()}-${photoFile.name}`;
      const contentType = photoFile.type;

      // 1. Get pre-signed URL
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

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: photoFile
      });
      if (!uploadRes.ok) throw new Error('Failed to upload file');

      photo_url = fileUrl;
    }

    // 3. Prepare and send payload
    const payload = {
      ...(reporter_id && { reporter_id }),
      full_name,
      age,
      gender,
      last_seen_date,
      last_seen_location,
      description,
      photo_url
    };

    const reportRes = await fetch(
      `${BASE}/missing-persons`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const result = await reportRes.json();

    if (reportRes.ok && result.success) {
      alert(`แจ้งเคสสำเร็จ รหัสเคส: ${result.case_id}`);
      document.getElementById('missing-form').reset();
      loadExistingCases();
    } else {
      console.error('Server error:', result);
      alert('เกิดข้อผิดพลาดในการแจ้งเคส');
    }
  } catch (err) {
    console.error('Error submitting missing case:', err);
    alert('ไม่สามารถอัปโหลดรูปหรือส่งข้อมูลได้');
  }
}

async function loadExistingCases() {
  try {
    const res = await fetch(`${BASE}/listCases`);
    if (!res.ok) throw new Error('Failed to load cases');

    const data = await res.json();
    const container = document.getElementById('cases-container');
    container.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p>ยังไม่มีเคสผู้สูญหาย</p>';
      return;
    }

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'case-card';

      card.innerHTML = `
        <p><strong>รหัสเคส:</strong> ${item.case_id}</p>
        ${item.photo_url ? `<img src="${item.photo_url}" class="person-img" alt="รูป ${item.full_name}" />` : ''}
        <h3>${item.full_name}</h3>
        <p>เพศ: ${item.gender} | อายุ: ${item.age}</p>
        <p><strong>วันที่หาย:</strong>
        ${new Date(item.last_seen_date) 
        .toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
        </p>
        <p>จังหวัด: ${item.last_seen_location}</p>
        <p><strong>รายละเอียดเพิ่มเติม:</strong> ${item.description || '-'}</p>
        <button class="btn-delete" data-id="${item.case_id}">ลบ</button>
      `;

      // 4. Attach delete handler
      card.querySelector('.btn-delete').addEventListener('click', async () => {
        if (!confirm('ยืนยันลบเคสนี้?')) return;
        try {
          const resDel = await fetch(
            `${BASE}/delete-Case/${item.case_id}`,
            { method: 'DELETE' }
          );
          const resultDel = await resDel.json();
          if (resDel.ok && resultDel.success) {
            alert('ลบเคสสำเร็จ');
            loadExistingCases();
          } else {
            alert('ลบไม่สำเร็จ: ' + (resultDel.message || resDel.status));
          }
        } catch (err) {
          console.error('Error deleting case:', err);
          alert('เกิดข้อผิดพลาดในการลบเคส');
        }
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Load cases error:', err);
    document.getElementById('cases-container').innerHTML =
      '<p>เกิดข้อผิดพลาดในการโหลดเคส</p>';
  }
}
