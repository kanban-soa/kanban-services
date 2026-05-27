# Kết quả kiểm thử — Workspace Service

> Phạm vi: kiểm thử các chức năng **liên quan trực tiếp tới workspace**, gồm 4 nhóm: **Tạo**, **Xem danh sách / chi tiết**, **Cập nhật**, **Xoá** workspace.
> Phần liên quan tới thành viên, quyền và role không nằm trong phạm vi lần kiểm thử này.

> Ngày chạy: **2026-05-27**

---

## 1. Tổng quan

| Hạng mục | Số lượng |
|---|---|
| Tổng test case | **18** |
| ✅ Pass | **16** |
| ❌ Fail | **2** |
| Tỷ lệ pass | **88.9%** |

### Tóm tắt theo nhóm chức năng

| Nhóm chức năng | Số TC | Pass | Fail |
|---|---|---|---|
| **A. Tạo workspace** | 3 | 3 | 0 |
| **B. Xem danh sách / chi tiết workspace** | 7 | 7 | 0 |
| **C. Cập nhật workspace** | 5 | 5 | 0 |
| **D. Xoá workspace** | 3 | 1 | 2 |

---

## 2. Nhóm A — Tạo workspace

| ID | Tính năng | Đầu vào | Điều kiện kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC01 | Tạo workspace trên giao diện | Nhấn "Tạo workspace", nhập tên "Acme" | Tài khoản đã đăng nhập | Workspace được tạo thành công (201), hiển thị tên và mã workspace mới (`publicId`) | ✅ PASS |
| TC02 | Tạo workspace nhưng để trống tên | Nhấn "Tạo workspace", không nhập tên | Tài khoản đã đăng nhập | Báo lỗi 400 "Tên workspace là bắt buộc", không tạo workspace | ✅ PASS |
| TC03 | Tạo workspace nhưng trùng tên | Nhấn "Tạo workspace", nhập tên "Acme" | Tài khoản đã đăng nhập; hệ thống đã có workspace tên "Acme" | Vẫn tạo workspace mới thành công (201); hệ thống tự sinh định danh khác để hai workspace cùng tên không trùng nhau | ✅ PASS |

**Kết luận nhóm A:** ✅ **3/3 PASS** — chức năng tạo workspace hoạt động đúng đặc tả.

---

## 3. Nhóm B — Xem danh sách / chi tiết workspace

| ID | Tính năng | Đầu vào | Điều kiện kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC04 | Lọc workspace đã xoá khỏi danh sách | Mở "Workspace của tôi" | Đã đăng nhập; người dùng thuộc 3 workspace, trong đó 1 workspace đã bị xoá mềm | Danh sách chỉ hiển thị 2 workspace còn hoạt động, không thấy workspace đã xoá | ✅ PASS |
| TC05 | Báo lỗi khi chưa có workspace nào | Mở ứng dụng lần đầu | Tài khoản mới, chưa có workspace nào | Báo lỗi 404 "Không tìm thấy workspace", chuyển sang trang khởi tạo | ✅ PASS |
| TC06 | Xem danh sách workspace của tôi | Nhấn "Workspace của tôi" | Đã đăng nhập, thuộc một số workspace còn hoạt động | Hiển thị toàn bộ workspace đang hoạt động kèm số lượng thành viên | ✅ PASS |
| TC07 | Mở workspace mặc định khi đăng nhập | Đăng nhập lại / mở app | Đã có ít nhất 1 workspace | Tự động mở workspace tạo gần nhất, hiển thị thông tin workspace và số thành viên | ✅ PASS |
| TC08 | Mở workspace mặc định khi chưa có | Mở app lần đầu | Tài khoản mới, chưa có workspace | Báo lỗi 404 "Không tìm thấy workspace" | ✅ PASS |
| TC09 | Truy cập workspace mà mình không phải thành viên | Mở đường dẫn workspace bất kỳ | Đã đăng nhập, không thuộc workspace đó | Bị từ chối 403 "Không có quyền truy cập" | ✅ PASS |
| TC10 | Truy cập workspace không tồn tại | Mở đường dẫn với ID workspace sai | Đã đăng nhập, ID không có trong hệ thống | Báo lỗi 404 "Không tìm thấy workspace" | ✅ PASS |

**Kết luận nhóm B:** ✅ **7/7 PASS** — luồng xem danh sách và chi tiết workspace hoạt động đúng đặc tả.

---

## 4. Nhóm C — Cập nhật workspace

| ID | Tính năng | Đầu vào | Điều kiện kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC11 | Đổi slug nhưng slug đã thuộc workspace khác | Đổi slug sang "taken" | Là admin của workspace; đã có workspace khác dùng slug "taken" | Báo lỗi 409 "Slug đã tồn tại", không lưu thay đổi | ✅ PASS |
| TC12 | Giữ nguyên slug khi cập nhật trường khác | Lưu lại form mà không đổi slug | Là admin của workspace | Cập nhật thành công, không báo lỗi trùng slug | ✅ PASS |
| TC13 | Admin cập nhật mô tả workspace | Nhập mô tả mới "new" và lưu | Là admin của workspace | Mô tả được lưu, giao diện hiển thị mô tả mới | ✅ PASS |
| TC14 | Thành viên thường cố cập nhật workspace | Nhấn "Sửa", đổi tên workspace | Chỉ là thành viên thường, không phải admin | Bị từ chối 403 "Không có quyền", workspace không bị thay đổi | ✅ PASS |
| TC15 | Đổi slug trùng workspace khác qua giao diện | Nhập slug "taken" và lưu | Là admin; slug "taken" đã thuộc workspace khác | Báo lỗi 409 "Slug đã tồn tại" | ✅ PASS |

**Kết luận nhóm C:** ✅ **5/5 PASS** — chức năng cập nhật workspace hoạt động đúng đặc tả, bao gồm ràng buộc slug duy nhất và phân quyền admin.

---

## 5. Nhóm D — Xoá workspace

| ID | Tính năng | Đầu vào | Điều kiện kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|
| TC16 | Xoá workspace ở tầng nghiệp vụ | Gọi xoá workspace | Là admin, workspace tồn tại và chưa bị xoá | Workspace được đánh dấu đã xoá (xoá mềm), ghi nhận thời điểm và người xoá | ✅ PASS |
| TC17 | Admin xoá workspace, các board cũng được dọn dẹp | Nhấn "Xoá workspace" và xác nhận | Là admin; dịch vụ board hoạt động bình thường | Trả về 204, workspace bị xoá, các board thuộc workspace cũng được xoá theo | ❌ FAIL |
| TC18 | Admin xoá workspace nhưng dịch vụ board lỗi | Nhấn "Xoá workspace" và xác nhận | Là admin; dịch vụ board tạm thời lỗi | Workspace vẫn xoá thành công (204), chỉ ghi log cảnh báo cho phần dọn dẹp board | ❌ FAIL |

**Kết luận nhóm D:** ❌ **1/3 PASS** — tầng nghiệp vụ chạy đúng, nhưng giao diện gọi xoá đang trả về lỗi 500 thay vì 204. Xem mục Phát hiện F-01.

---

## 6. Phát hiện (Findings)

### F-01 — Chức năng "Xoá workspace" qua API đang bị lỗi

**Mức độ:** 🔴 Blocker — endpoint `DELETE /api/workspaces/:id` không hoạt động.

**Hiện tượng:** Khi người dùng nhấn "Xoá workspace", thay vì xoá thành công (204), hệ thống trả về lỗi 500 (Internal Server Error). TC17 và TC18 đều không pass vì lý do này.

**Đề xuất:** Kiểm tra lại tầng xử lý request của thao tác xoá để đảm bảo lấy đúng tham số workspace từ URL, sau đó chạy lại TC17 và TC18.

---

## 7. Ma trận dò vết theo nhóm chức năng

| Nhóm chức năng | Test case | Trạng thái |
|---|---|---|
| A. Tạo workspace | TC01, TC02, TC03 | ✅ Toàn bộ pass |
| B. Xem danh sách / chi tiết workspace | TC04, TC05, TC06, TC07, TC08, TC09, TC10 | ✅ Toàn bộ pass |
| C. Cập nhật workspace | TC11, TC12, TC13, TC14, TC15 | ✅ Toàn bộ pass |
| D. Xoá workspace | TC16, TC17, TC18 | ❌ Còn 2 TC fail (xem F-01) |

---

## 8. Cách chạy lại bộ test

Từ thư mục `root/services/workspace-service/`:

```bash
npx vitest run                     # chạy 1 lần và thoát
npx vitest                         # chế độ watch
npx vitest run --reporter=verbose  # in từng test case
```

Hoặc từ thư mục gốc `kanban-services/`:

```bash
npm test --workspace=root/services/workspace-service
```

---

## 9. Phần đã loại trừ khỏi lần kiểm thử này

Các nhóm dưới đây không nằm trong phạm vi của lần kiểm thử "chỉ workspace":

- Mời thành viên vào workspace
- Xem danh sách / chi tiết thành viên
- Cập nhật vai trò thành viên
- Xoá thành viên khỏi workspace
- Kiểm tra quyền (permission)
- Tạo role tuỳ chỉnh
- Gán permission cho role
- Kịch bản End-to-End trên UI (Playwright)
