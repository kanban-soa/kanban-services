# Ma trận dò vết kiểm thử (Traceability Matrix)

> Liên kết hai chiều giữa **use case → test case**, **test case → use case**, **test case → module code**, và **test case → finding**.
> Nguồn: `__tests__/TEST_RESULTS.md` (18 TC) + `workspace-usecase-testplan.md` (UC-WS-01..06).
> Ngày: **2026-05-27**.

---

## 1. Ma trận xuôi: Use case → Test case

Mỗi use case (yêu cầu) được phủ bởi tối thiểu 1 test case happy-path và 1 test case lỗi tiêu biểu.

| Mã UC | Tên use case | Nhóm chức năng | Test case phủ | Số TC | Tổng Pass | Tổng Fail | Kết luận |
|---|---|---|---|---|---|---|---|
| UC-WS-01 | Tạo workspace mới | A. Tạo | TC01, TC02, TC03 | 3 | 3 | 0 | ✅ Đã phủ |
| UC-WS-02 | Xem danh sách workspace của tôi | B. Xem | TC04, TC06 | 2 | 2 | 0 | ✅ Đã phủ |
| UC-WS-03 | Xem workspace mặc định | B. Xem | TC05, TC07, TC08 | 3 | 3 | 0 | ✅ Đã phủ |
| UC-WS-04 | Xem chi tiết workspace | B. Xem | TC09, TC10 | 2 | 2 | 0 | ✅ Đã phủ |
| UC-WS-05 | Cập nhật workspace | C. Cập nhật | TC11, TC12, TC13, TC14, TC15 | 5 | 5 | 0 | ✅ Đã phủ |
| UC-WS-06 | Xoá workspace | D. Xoá | TC16, TC17, TC18 | 3 | 1 | 2 | ❌ Có TC fail |

**Coverage:** 6/6 use case workspace có ít nhất 1 TC → **độ phủ use case = 100%**.

---

## 2. Ma trận ngược: Test case → Use case + Loại kịch bản

| ID TC | Tên test case (rút gọn) | Use case | Loại kịch bản | Kết quả |
|---|---|---|---|---|
| TC01 | Tạo workspace trên giao diện | UC-WS-01 | Happy path | ✅ |
| TC02 | Tạo workspace nhưng để trống tên | UC-WS-01 | Validate input | ✅ |
| TC03 | Tạo workspace nhưng trùng tên | UC-WS-01 | Edge case (slug auto-resolve) | ✅ |
| TC04 | Lọc workspace đã xoá khỏi danh sách | UC-WS-02 | Soft-delete filtering | ✅ |
| TC05 | Báo lỗi khi chưa có workspace nào | UC-WS-03 | Empty state | ✅ |
| TC06 | Xem danh sách workspace của tôi | UC-WS-02 | Happy path | ✅ |
| TC07 | Mở workspace mặc định khi đăng nhập | UC-WS-03 | Happy path | ✅ |
| TC08 | Mở workspace mặc định khi chưa có | UC-WS-03 | Empty state | ✅ |
| TC09 | Truy cập workspace không phải thành viên | UC-WS-04 | Phân quyền (403) | ✅ |
| TC10 | Truy cập workspace không tồn tại | UC-WS-04 | Not found (404) | ✅ |
| TC11 | Đổi slug trùng workspace khác (tầng nghiệp vụ) | UC-WS-05 | Slug uniqueness | ✅ |
| TC12 | Giữ nguyên slug khi cập nhật | UC-WS-05 | Edge case (slug = current) | ✅ |
| TC13 | Admin cập nhật mô tả workspace | UC-WS-05 | Happy path | ✅ |
| TC14 | Thành viên thường cố cập nhật | UC-WS-05 | Phân quyền (403) | ✅ |
| TC15 | Đổi slug trùng workspace khác (giao diện) | UC-WS-05 | Slug uniqueness (HTTP 409) | ✅ |
| TC16 | Xoá workspace ở tầng nghiệp vụ | UC-WS-06 | Happy path (service layer) | ✅ |
| TC17 | Admin xoá workspace, board dọn dẹp | UC-WS-06 | Happy path (HTTP layer) | ❌ |
| TC18 | Admin xoá workspace nhưng board service lỗi | UC-WS-06 | Best-effort cascade | ❌ |

---

## 3. Ma trận TC → Module code

Cho biết mỗi TC khi chạy sẽ chạm vào những file/hàm nào — phục vụ phân tích impact và root-cause khi có lỗi.

| ID TC | Controller | Service | Repository | External Client |
|---|---|---|---|---|
| TC01 | `workspace.controller.ts::create` | `workspace.service.ts::createWorkspace` | `workspace.repo.ts::slugExists`, `create` | `authClient.getUserById` |
| TC02 | `workspace.controller.ts::create` (validate) | — | — | — |
| TC03 | `workspace.controller.ts::create` | `workspace.service.ts::createWorkspace` | `workspace.repo.ts::slugExists`, `create` | `authClient.getUserById` |
| TC04 | `workspace.controller.ts::getAll` | `workspace.service.ts::getWorkspacesByUser` | `member.repo.ts::findWorkspacesByUserId`, `workspace.repo.ts::findById` | — |
| TC05 | `workspace.controller.ts::getDefault` | `workspace.service.ts::getDefaultWorkspace` | `workspace.repo.ts::findLatestByUser` | — |
| TC06 | `workspace.controller.ts::getAll` | `workspace.service.ts::getWorkspacesByUser` | `member.repo.ts::findWorkspacesByUserId`, `workspace.repo.ts::findById` | — |
| TC07 | `workspace.controller.ts::getDefault` | `workspace.service.ts::getDefaultWorkspace` | `workspace.repo.ts::findLatestByUser`, `member.repo.ts::countByWorkspace` | — |
| TC08 | `workspace.controller.ts::getDefault` | `workspace.service.ts::getDefaultWorkspace` | `workspace.repo.ts::findLatestByUser` | — |
| TC09 | `workspace.controller.ts::getById` | `workspace.service.ts::getWorkspaceByPublicId`, `isMember` | `workspace.repo.ts::findByPublicId`, `member.repo.ts::findByUserAndWorkspace` | — |
| TC10 | `workspace.controller.ts::getById` | `workspace.service.ts::getWorkspaceByPublicId` | `workspace.repo.ts::findByPublicId` | — |
| TC11 | — (service-level) | `workspace.service.ts::updateWorkspace` | `workspace.repo.ts::slugExists` | — |
| TC12 | — (service-level) | `workspace.service.ts::updateWorkspace` | `workspace.repo.ts::slugExists`, `update` | — |
| TC13 | `workspace.controller.ts::update` | `workspace.service.ts::updateWorkspace`, `isAdmin` | `workspace.repo.ts::findByPublicId`, `update`, `member.repo.ts::findByUserAndWorkspace` | — |
| TC14 | `workspace.controller.ts::update` | `workspace.service.ts::isAdmin` | `member.repo.ts::findByUserAndWorkspace` | — |
| TC15 | `workspace.controller.ts::update` | `workspace.service.ts::updateWorkspace`, `isAdmin` | `workspace.repo.ts::slugExists` | — |
| TC16 | — (service-level) | `workspace.service.ts::deleteWorkspace` | `workspace.repo.ts::findById`, `softDelete` | — |
| TC17 | `workspace.controller.ts::delete` ❌ | `workspace.service.ts::deleteWorkspace` | `workspace.repo.ts::softDelete` | `boardClient.deleteBoardsByWorkspace` |
| TC18 | `workspace.controller.ts::delete` ❌ | `workspace.service.ts::deleteWorkspace` | `workspace.repo.ts::softDelete` | `boardClient.deleteBoardsByWorkspace` (rejected) |

> Dấu ❌ ở Controller cho biết bug F-01 nằm tại tầng đó.

---

## 4. Ma trận TC → Finding / Defect

| Finding | Mức độ | Test case phát hiện | Use case bị ảnh hưởng | Module liên quan | Trạng thái |
|---|---|---|---|---|---|
| **F-01** Lỗi `ReferenceError` trong `WorkspaceController.delete` | 🔴 Blocker | TC17, TC18 | UC-WS-06 | `api/controllers/workspace.controller.ts:160-201` | Chưa fix |

Chi tiết F-01 nằm ở mục **6. Phát hiện** của `__tests__/TEST_RESULTS.md`.

---

## 5. Ma trận TC → Kỹ thuật thiết kế testcase

Đối chiếu với các kỹ thuật thiết kế ở Chương 2.2.2 báo cáo.

| Kỹ thuật | Áp dụng tại | TC liên quan |
|---|---|---|
| **Phân hoạch lớp tương đương** | Trường `name` (rỗng / hợp lệ) | TC01, TC02 |
| **Phân hoạch lớp tương đương** | `publicId` (tồn tại / không tồn tại) | TC09, TC10 |
| **Phân hoạch lớp tương đương** | Vai trò người gọi (admin / member / non-member) | TC09, TC13, TC14 |
| **Phân tích giá trị biên** | Trạng thái `deletedAt` của workspace (null / không null) | TC04 |
| **Phân tích giá trị biên** | Số lượng workspace của user (0 / ≥1) | TC05, TC07, TC08 |
| **Bảng quyết định (Decision Table)** | Update slug × ownership (admin/member) × trùng hay không | TC11..15 |
| **Bảng quyết định** | Delete workspace × board-service (OK/lỗi) | TC17, TC18 |
| **Kiểm thử trạng thái** | Vòng đời workspace (active → soft_deleted) | TC04, TC16, TC17 |
| **Kiểm thử ngoại lệ** | Kịch bản fail của dependency ngoài (board-service down) | TC18 |

---

## 6. Ma trận TC → Tầng kiểm thử

| Tầng kiểm thử | Mục tiêu | TC thuộc tầng | Tỉ lệ |
|---|---|---|---|
| **Unit test** (Vitest, mock repo) | Logic business trong service layer | TC04, TC05, TC11, TC12, TC16 | 5/18 (28%) |
| **Integration test** (Vitest + supertest) | HTTP behavior, end-to-end controller/service/repo (mocked DB) | TC01, TC02, TC03, TC06, TC07, TC08, TC09, TC10, TC13, TC14, TC15, TC17, TC18 | 13/18 (72%) |
| **E2E test** (Playwright) | UI flow trên browser | — (ngoài phạm vi) | 0/18 |

---

## 7. Coverage Summary

| Loại coverage | Mong đợi (DoD) | Thực tế | Đạt? |
|---|---|---|---|
| **Use case coverage** (% UC có ≥ 1 TC) | 100% | 100% (6/6) | ✅ |
| **Endpoint coverage** workspace (6 endpoint) | 100% | 100% (6/6) | ✅ |
| **Happy-path coverage** mỗi use case | 100% | 100% (6/6) | ✅ |
| **Error-case coverage** mỗi use case | ≥ 1 case | UC-WS-01..05 đạt; UC-WS-06 đạt cả 2 case lỗi nhưng cả 2 đang FAIL | ⚠️ |
| **Branch coverage tối thiểu** (DoD: ≥ 80%) | ≥ 80% | Chưa đo bằng `vitest --coverage` | ⏳ Chưa đo |

---

## 8. Kết luận

- **100% use case workspace** đã được phủ bởi test case → đạt yêu cầu truy vết.
- **16/18 TC pass (88.9%)** — toàn bộ luồng Tạo / Xem / Cập nhật đều xanh.
- **2 TC fail tại UC-WS-06** đều quy về một root cause duy nhất (F-01) ở tầng controller. Sau khi fix bug, hai TC này dự kiến pass mà không cần thay đổi test.
- Bước tiếp theo nên đo **branch coverage** bằng `npx vitest run --coverage` để xác thực mục DoD ≥ 80%.

## 9. Tham chiếu

- `__tests__/TEST_RESULTS.md` — chi tiết từng test case.
- `__tests__/unit/workspace.service.spec.ts` — file unit test.
- `__tests__/integration/workspace.api.spec.ts` — file integration test.
- `workspace-usecase-testplan.md` (root) — đặc tả use case chi tiết.
- `docs/use-case-diagram.md` — biểu đồ use case workspace.
