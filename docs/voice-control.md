# Voice Control API Documentation

## Overview
Voice Control API sử dụng Google Gemini AI để xử lý các lệnh điều khiển và truy vấn thông tin thiết bị thông minh bằng ngôn ngữ tự nhiên.

## API Endpoint
```
POST /voice-controller
```

## Request Body
```json
{
  "text": "string",         // Câu lệnh điều khiển hoặc truy vấn
  "controllerId": "string"  // ID của controller
}
```

## Response Format
API trả về chuỗi text mô tả kết quả thực hiện:

### 1. Lệnh Điều Khiển (Control Command)
#### Điều khiển bật/tắt
```
"Đã bật/tắt [tên thiết bị] ở [tên phòng]"
```
Ví dụ:
- "Đã bật đèn phòng khách"
- "Đã tắt đèn phòng ngủ, đèn phòng khách"

#### Điều chỉnh giá trị
```
"Đã điều chỉnh [tên thiết bị] ở [tên phòng] thành [giá trị][đơn vị]"
```
Ví dụ:
- "Đã điều chỉnh điều hòa phòng ngủ thành 25°C"
- "Đã điều chỉnh đèn phòng khách thành 50%"

#### Không có thay đổi
```
"Không có thiết bị nào cần thay đổi"
```

### 2. Truy Vấn Thông Tin (Info Query)
```
"[Thông tin về trạng thái hoặc giá trị của thiết bị]"
```
Ví dụ:
- "Nhiệt độ phòng khách đang là 25°C"
- "Đèn phòng ngủ đang tắt"
- "Có 2 đèn đang bật: đèn phòng khách và đèn phòng ngủ"

## Device Context Format
Mỗi thiết bị được định dạng: `name|room>id:status:value unit`
- `name`: Tên thiết bị
- `room`: Tên phòng
- `id`: ID thiết bị
- `status`: Trạng thái (0=OFF, 1=ON)
- `value`: Giá trị đo được (nếu có)
- `unit`: Đơn vị đo (nếu có)

## Ví dụ

### 1. Điều Khiển Thiết Bị

#### Bật/tắt
Request:
```json
{
  "text": "tắt đèn phòng ngủ",
  "controllerId": "controller-123"
}
```

Response:
```
"Đã tắt đèn phòng ngủ"
```

#### Điều chỉnh giá trị
Request:
```json
{
  "text": "chỉnh nhiệt độ điều hòa phòng ngủ lên 25 độ",
  "controllerId": "controller-123"
}
```

Response:
```
"Đã điều chỉnh điều hòa phòng ngủ thành 25°C"
```

### 2. Truy Vấn Thông Tin
Request:
```json
{
  "text": "nhiệt độ phòng khách bao nhiêu",
  "controllerId": "controller-123"
}
```

Response:
```
"Nhiệt độ phòng khách đang là 25°C"
```

## Lưu ý Bảo Mật
- API không trả về các thông tin nhạy cảm như ID trong câu trả lời
- Cần cung cấp GEMINI_API_KEY trong file .env

## Cài Đặt
1. Thêm GEMINI_API_KEY vào file .env:
```env
GEMINI_API_KEY=your-gemini-api-key
```

2. Cài đặt dependencies:
```bash
npm install
```

## Các Loại Câu Lệnh Hỗ Trợ

### Điều Khiển
- Bật/tắt thiết bị: "bật đèn phòng khách"
- Điều chỉnh giá trị: "chỉnh nhiệt độ điều hòa lên 25 độ"
- Điều khiển theo phòng: "tắt tất cả đèn phòng ngủ"
- Điều khiển theo ngữ cảnh: "trời sáng rồi tắt đèn đi"

### Truy Vấn
- Trạng thái thiết bị: "đèn phòng khách có bật không"
- Thông số đo được: "nhiệt độ phòng ngủ bao nhiêu"
- Tình trạng chung: "những đèn nào đang bật"
