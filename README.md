# Kaç Yaktı? — Supabase sürümü

## Kurulum sırası

1. Supabase üzerinde yeni proje oluştur.
2. `supabase/schema.sql` dosyasını SQL Editor içinde çalıştır.
3. Supabase Dashboard > Authentication > URL Configuration bölümünde site adresini ekle.
4. Project Settings > API bölümünden Project URL ve anon/publishable key değerlerini al.
5. Bu değerleri `js/supabase.js` dosyasına yaz.
6. Projeyi bir web sunucusu üzerinden çalıştır. VS Code Live Server veya GitHub Pages kullanılabilir.

> `index.html` dosyasına çift tıklayarak `file://` üzerinden çalıştırmak yerine Live Server kullanılması önerilir.

## Güvenlik

Tarayıcı kodunda yalnızca anon/publishable key kullanılmalıdır. `service_role` anahtarını asla frontend dosyalarına koyma.
