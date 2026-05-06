# Board Service

Dịch vụ này chịu trách nhiệm quản lý tất cả các hoạt động liên quan đến "boards" trong hệ thống Kanban, bao gồm tạo, đọc, cập nhật và quản lý các thành phần con như danh sách (lists) và thẻ (cards).

## ✨ Tính Năng

- **Quản lý Board:** Tạo, lấy thông tin chi tiết và cập nhật board.
- **Quản lý List:** Tạo, lấy và cập nhật các danh sách trong một board.
- **Quản lý Card:** Tạo, lấy và cập nhật các thẻ trong một danh sách.
- **Validation:** Sử dụng Zod để xác thực dữ liệu đầu vào cho các yêu cầu API.
- **ORM:** Sử dụng Drizzle ORM để tương tác với cơ sở dữ liệu PostgreSQL một cách an toàn và hiệu quả.

## 🚀 Bắt đầu

### Yêu cầu

- [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) và [Docker Compose](https://docs.docker.com/compose/) (để chạy cơ sở dữ liệu PostgreSQL)

### Cài đặt

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd kanban-services/root/services/board-service
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình biến môi trường:**
    Tạo một tệp `.env` trong thư mục gốc của `board-service` và sao chép nội dung từ `.env.example` (nếu có) hoặc sử dụng cấu trúc sau:

    ```env
    # Cổng cho dịch vụ board
    BOARD_PORT=3001

    # Chuỗi kết nối đến cơ sở dữ liệu PostgreSQL
    BOARD_URL="postgresql://<user>:<password>@<host>:<port>/<database>"
    ```
    *Lưu ý:* Đảm bảo cổng trong `BOARD_URL` khớp với cổng mà Docker container của bạn đang expose (ví dụ: `5435`).

4.  **Khởi động cơ sở dữ liệu:**
    Nếu bạn có tệp `docker-compose.yml` để quản lý PostgreSQL, hãy chạy:
    ```bash
    docker-compose up -d
    ```
    Nếu không, hãy đảm bảo dịch vụ PostgreSQL của bạn đang chạy.

5.  **Đồng bộ schema cơ sở dữ liệu:**
    Lệnh này sẽ đẩy các định nghĩa schema từ mã nguồn của bạn vào cơ sở dữ liệu.
    ```bash
    npm run db:push
    ```

6.  **Khởi động dịch vụ:**
    ```bash
    npm run dev
    ```
    Máy chủ sẽ khởi động tại `http://localhost:3001` (hoặc cổng bạn đã cấu hình).

## 🛠️ Scripts

-   `npm run dev`: Khởi động máy chủ phát triển với `nodemon` để tự động tải lại khi có thay đổi.
-   `npm run db:push`: Áp dụng các thay đổi về schema (từ thư mục `/schema`) vào cơ sở dữ liệu.

## 🔗 API Endpoints

### Boards

-   `POST /api/boards`
    -   Tạo một board mới.
    -   **Body:**
        ```json
        {
          "name": "My New Board",
          "workspaceId": "1",
          "description": "Optional description."
        }
        ```

-   `GET /api/boards/:boardId`
    -   Lấy thông tin chi tiết của một board bằng `publicId`.

-   `PATCH /api/boards/:boardId`
    -   Cập nhật thông tin của một board.
    -   **Body:**
        ```json
        {
          "name": "Updated Name",
          "description": "Updated description."
        }
        ```


## 🏗️ Cấu trúc dự án

-   `api/`: Chứa các controllers, routes, và DTOs (Data Transfer Objects).
-   `config/`: Cấu hình kết nối cơ sở dữ liệu.
-   `middlewares/`: Các middleware tùy chỉnh (ví dụ: `validate`).
-   `repositories/`: Lớp truy cập dữ liệu, tương tác trực tiếp với cơ sở dữ liệu.
-   `schema/`: Định nghĩa schema cho cơ sở dữ liệu bằng Drizzle ORM.
-   `services/`: Chứa logic nghiệp vụ của ứng dụng.
-   `shared/`: Các hàm và tiện ích dùng chung.
