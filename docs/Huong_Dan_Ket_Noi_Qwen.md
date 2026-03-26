# BỘ TÀI LIỆU CẤU HÌNH AI "THINKING" (QWEN 3.5 35B) VÀO IDE
> Dành cho Live Coding & Bảo trì Dự án Lớn
> Phiên bản Tối ưu hóa: 100% VRAM (Card MI50 32GB) - Nén KV Cache Q8_0 - Context 140.000 Tokens.

Máy chủ AI nội bộ (Central AI Server) đang chạy tại địa chỉ LAN: `192.168.1.35`. Thiết lập này giúp các máy tính con trong mạn LAN (PC, Laptop) kết nối trực tiếp vào năng lực suy luận mạnh mẽ của máy chủ mà không bị nghẽn RAM do dùng 100% tài nguyên card đồ họa.

---

## PHẦN 1: THÔNG SỐ SERVER DÀNH CHO BẤT KỲ ỨNG DỤNG NÀO (OpenAI Compatible)

Các tham số cốt lõi để điền vào hệ thống IDE (Cursor, VSCode, JetBrains, WebUI...):

- **API Base / Base URL:** `http://192.168.1.35:8080/v1`  *(Lưu ý: Bắt buộc phải có hậu tố `/v1`)*
- **API Key:** `sk-local` *(Bạn điền bất cứ nội dung gì cũng được)*
- **Model Name:** `Qwen3.5-35B-A3B-Coder`
  *(Tên mô hình đã được cố định cứng trong lõi Server. Các IDE có nút "Fetch Models" sẽ tự động trỏ đúng tên này)*
- **Max Context / N_Predict:** Tùy ý tới 140,000 tokens. (Khuyên dùng: `32768` để IDE tránh đọc tràn lan).
- **GPU Inference Speed:** 50 - 60 Tokens/giây.

---

## PHẦN 2: THIẾT LẬP KÍCH HOẠT CHẾ ĐỘ "THINKING" NHƯ CLAUDE OPUS

Vì đây là dòng Qwen 3.5 MoE hỗ trợ suy nghĩ (CoT - Chain of Thought), bạn muốn AI giải quyết các logic khó trước khi code thì **BẮT BUỘC** phải chặn sai số bằng System Prompt sau. 

👉 **Copy và dán nguyên văn đoạn chữ tiếng Anh này vào ô "System Prompt", "Custom Instructions", hoặc "System Message" của Extension:**

```text
You are an expert AI software engineer, system architect, and coding assistant. 
Before writing any code, modifying files, or answering the user's prompt, you MUST carefully think step-by-step. 

RULES FOR THINKING:
1. You must write your entire thought process strictly inside <think> and </think> tags. 
2. Inside the <think> tags, analyze the requirements, review the provided code context, plan the precise architecture modifications, and anticipate edge cases.
3. NEVER output any final code inside the <think> tags. 
4. Once your thought process is complete, close the </think> tag and provide the final optimized and syntactically correct code directly to the user.
```

👉 **Tinh chỉnh Sampler (Rất quan trọng cho Code):**
- **Temperature (Nhiệt độ):** Đặt ở mức `0.3` cho sửa code thông thường, và `0.5` cho sáng tạo tính năng mới (Tránh để trên 0.6 vì model sẽ sinh ảo giác hàm không tồn tại).
- **Top_P:** `0.9`
- **Min_P (Nếu Extension có hỗ trợ):** `0.05`. (Giúp gạt bỏ tỷ lệ sinh từ rác rưởi).

---

## PHẦN 3: HƯỚNG DẪN CHI TIẾT THEO TỪNG EXTENSION / NỀN TẢNG

### 🛠 Dành cho Extension "Continue.dev" (VSCode / JetBrains)
Ứng dụng cực kỳ tốt vì có tính năng nhúng file (RAG) `@Files`.
1. Mở file `config.json` (Góc phải dưới cửa sổ Continue).
2. Tìm mảng `"models": [...]` và thêm khối lệnh này vào giữa:

```json
{
  "title": "Qwen 35B Live Coder (LAN)",
  "provider": "openai",
  "model": "Qwen3.5-35B-A3B-Coder",
  "apiBase": "http://192.168.1.35:8080/v1/",
  "apiKey": "sk-local",
  "systemMessage": "You are an expert AI software engineer, system architect, and coding assistant. Before writing any code, modifying files, or answering the user's prompt, you MUST carefully think step-by-step. \n\nRULES FOR THINKING:\n1. You must write your entire thought process strictly inside <think> and </think> tags.\n2. Inside the <think> tags, analyze the requirements, review the provided code context, plan the precise architecture modifications, and anticipate edge cases.\n3. NEVER output any final code inside the <think> tags.\n4. Once your thought process is complete, close the </think> tag and provide the final optimized and syntactically correct code directly to the user.",
  "completionOptions": {
    "temperature": 0.3,
    "top_p": 0.9
  }
}
```

### 🛠 Dành cho Extension "Cline" / "Roo Code" (VSCode)
Cline nổi tiếng là siêu trợ lý làm Agent tự động đọc/ghi toàn bộ hệ thống file dự án khổng lồ.
1. Mở cài đặt (Lẫy hình răng cưa trên Extension).
2. Tại mục **API Provider**, bấm chọn **OpenAI Compatible**.
3. **Base URL:** Nhập `http://192.168.1.35:8080/v1`
4. **API Key:** Nhập `sk-local`
5. Nhấn biểu tượng "Vòng xoay" (Fetch/Refresh models), mục thả xuống sẽ hiện tên: `Qwen3.5-35B-A3B-Coder`. Bạn tick chọn.
6. Kéo xuống cuối thấy mục **Custom Instructions**, copy đoạn cờ lệnh ở **PHẦN 2** dán vào đó.

### 🛠 Dành cho Open WebUI / LM Studio (Chat Bot)
1. Thêm kết nối OpenAI Compatible (trong Network Settings/Connections).
2. Base URL nhập nguyên xi `http://192.168.1.35:8080/v1`.
3. Client sẽ gửi lệnh Get Models liên tục, lấy thành thạo và lưu vào Data base phục vụ các nhu cầu Chat ngoài lề.
