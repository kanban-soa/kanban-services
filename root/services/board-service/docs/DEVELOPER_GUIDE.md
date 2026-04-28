# Hướng Dẫn Dành Cho Nhà Phát Triển - Board Service

Chào mừng đến với Board Service! Tài liệu này sẽ hướng dẫn bạn về cấu trúc dự án, các công nghệ sử dụng, và quy trình làm việc để bạn có thể nhanh chóng bắt đầu đóng góp.

## 1. Giới Thiệu

**Board Service** là một microservice chịu trách nhiệm quản lý mọi thứ liên quan đến một "board" trong ứng dụng Kanban, bao gồm:
- Boards (Bảng)
- Lists (Danh sách công việc)
- Cards (Thẻ công việc)
- Labels (Nhãn)
- và các hoạt động liên quan.

Service này được xây dựng bằng **Express.js** trên nền tảng **Node.js** và sử dụng **TypeScript**.

## 2. Công Nghệ Cốt Lõi

- **Framework**: Express.js
- **Ngôn ngữ**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (để tương tác với database một cách type-safe)
- **Validation**: Zod (để xác thực dữ liệu đầu vào)
- **Môi trường**: Node.js

## 3. Cấu Trúc Dự Án

Dự án tuân theo kiến trúc 3 lớp (Controller - Service - Repository) để phân tách rõ ràng các mối quan tâm.

```
/
├── api/
│   ├── controllers/  # Lớp xử lý request/response HTTP
│   ├── dto/          # Data Transfer Objects & Schemas validation (Zod)
│   └── routes/       # Định nghĩa các API endpoints
├── config/           # Cấu hình (database, môi trường)
├── docs/             # Tài liệu dự án
├── middleware/       # Các middleware (error handling, validation, auth)
├── repository/       # Lớp truy cập dữ liệu (Database queries)
├── schema/           # Drizzle ORM schemas (Định nghĩa cấu trúc bảng DB)
├── seeds/            # Dữ liệu mẫu để khởi tạo DB
├── services/         # Lớp chứa business logic
├── shared/           # Code dùng chung (utils, error classes)
├── .env.example      # File môi trường mẫu
├── app.ts            # Entry point của Express app
├── package.json      # Quản lý dependencies và scripts
└── tsconfig.json     # Cấu hình TypeScript
```

## 4. Cài Đặt & Khởi Chạy

1.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```

2.  **Cấu hình môi trường**:
    - Sao chép file `.env.example` thành `.env`.
    - Điền các thông tin cần thiết, đặc biệt là `BOARD_URL` (chuỗi kết nối PostgreSQL) và `BOARD_PORT`.
    ```
    BOARD_URL="postgresql://user:password@host:port/database"
    BOARD_PORT=3001
    ```

3.  **Đồng bộ Database Schema**:
    Chạy lệnh sau để Drizzle ORM tự động tạo hoặc cập nhật các bảng trong database dựa trên schema bạn đã định nghĩa trong thư mục `schema/`.
    ```bash
    npm run db:push
    ```

4.  **Chạy server ở chế độ development**:
    Lệnh này sẽ khởi động server và tự động restart khi có thay đổi trong code.
    ```bash
    npm run dev
    ```
    Server sẽ chạy tại `http://localhost:PORT` (với `PORT` bạn đã cấu hình trong `.env`).

5.  **(Tùy chọn) Seed dữ liệu mẫu**:
    Nếu bạn muốn có dữ liệu ban đầu để test, hãy chạy:
    ```bash
    npm run db:seed
    ```

## 5. Quy Trình Phát Triển (Thêm một API mới)

Đây là luồng công việc chuẩn để thêm một tính năng (ví dụ: "Lấy board theo ID").

**Bước 1: Schema (Nếu cần)**
- Nếu có thay đổi về cấu trúc DB, hãy cập nhật các file trong `schema/`.

**Bước 2: Repository (`repository/board.repository.ts`)**
- Tạo một hàm để thực hiện truy vấn database.
- **Nguyên tắc**: Lớp này chỉ chịu trách nhiệm duy nhất là nói chuyện với DB. Không chứa business logic.
- Ví dụ:
  ```typescript
  const findBoardById = async (id: number) => {
    return db.query.boards.findFirst({ where: eq(boards.id, id) });
  };
  ```

**Bước 3: Service (`services/board.service.ts`)**
- Gọi hàm từ repository để lấy dữ liệu.
- Thực thi business logic (kiểm tra, xử lý dữ liệu).
- Ném lỗi `ApiError` nếu có vấn đề (e.g., không tìm thấy).
- Ví dụ:
  ```typescript
  const getBoardById = async (id: number) => {
    const board = await boardRepository.findBoardById(id);
    if (!board) {
      throw new ApiError(404, 'Board not found');
    }
    return board;
  };
  ```

**Bước 4: DTO & Validation (`api/dto/board.dto.ts`)**
- Định nghĩa schema validation cho request (params, query, body) bằng Zod.
- Ví dụ:
  ```typescript
  export const getBoardByIdSchema = z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/, 'Board ID must be a number'),
    }),
  });
  ```

**Bước 5: Controller (`api/controllers/board.controller.ts`)**
- Gọi service để thực thi logic.
- Bắt lỗi và chuyển cho `errorMiddleware` thông qua `next(error)`.
- Gửi response về cho client bằng `success()` hoặc `failure()` utilities.
- Ví dụ:
  ```typescript
  const getBoardById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = parseInt(req.params.id, 10);
      const board = await boardService.getBoardById(boardId);
      return success(res, 'Board retrieved successfully', board);
    } catch (error) {
      next(error);
    }
  };
  ```

**Bước 6: Route (`api/routes/board.route.ts`)**
- Thêm endpoint mới, gắn controller và middleware validation tương ứng.
- Ví dụ:
  ```typescript
  import { validate } from '@/board-service/middleware/validation.middleware';
  import { getBoardByIdSchema } from '../dto/board.dto';

  router.get(
    '/:id',
    validate(getBoardByIdSchema),
    boardController.getBoardById
  );
  ```

## 6. Xử Lý Lỗi (Error Handling)

- Sử dụng `try...catch` trong **Controller** và **Service**.
- Khi có lỗi nghiệp vụ có thể dự đoán (e.g., không tìm thấy, không có quyền), hãy `throw new ApiError(statusCode, message)`.
- Middleware `error.middleware.ts` sẽ tự động bắt tất cả các lỗi và format chúng thành một JSON response chuẩn.

## 7. Coding Conventions

- **Tên file**: Dùng `kebab-case.ts` (e.g., `board.service.ts`).
- **Biến & Hàm**: Dùng `camelCase`.
- **Async/Await**: Luôn sử dụng `async/await` cho các tác vụ bất đồng bộ và bọc chúng trong `try...catch`.
- **Imports**: Sử dụng alias `@/board-service/*` đã được cấu hình để tránh các đường dẫn tương đối phức tạp (`../../...`).

---
