-- Đổi thang điểm đánh giá từ 1–5 sang 1–10 (khách chấm trực tiếp trên thang 10).
-- Review CŨ đang lưu ở thang 1–5 ⇒ ×2 để giữ nguyên ý nghĩa (5 sao cũ = 10/10). Chặn không vượt 10.
-- Tại thời điểm chạy migration này, mọi review đang là 1–5 (code cũ chặn > 5), nên ×2 là an toàn.
UPDATE "reviews" SET
  "overall_rating"     = LEAST("overall_rating" * 2, 10),
  "cleanliness_rating" = LEAST("cleanliness_rating" * 2, 10),
  "service_rating"     = LEAST("service_rating" * 2, 10),
  "location_rating"    = LEAST("location_rating" * 2, 10),
  "value_rating"       = LEAST("value_rating" * 2, 10);
