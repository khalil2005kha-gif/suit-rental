@echo off
chcp 65001 > nul
title نظام الرفع السريع إلى GitHub بدون Render

echo ===================================================
echo             نظام الرفع إلى GitHub
echo ===================================================
echo.

:: التحقق من أن المجلد يحتوي على مستودع Git
git rev-parse --is-inside-work-tree > nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] المجلد الحالي ليس مستودع Git أو أن Git غير مثبت.
    goto end
)

:: التحقق من وجود تغييرات جديدة
git status --porcelain | findstr /R "^" > nul
if %errorlevel% neq 0 (
    echo [تنبيه] لا توجد أي تغييرات جديدة لرفعها.
    goto end
)

echo التغييرات المكتشفة في مشروعك:
echo ---------------------------------------------------
git status -s
echo ---------------------------------------------------
echo.

set /p msg="أدخل وصف التعديلات (Commit Message): "

if "%msg%"=="" (
    set msg=تحديثات عامة
)

echo.
echo [1/3] جاري إضافة الملفات...
git add .

echo.
echo [2/3] جاري حفظ التعديلات محلياً وتخطي بناء Render...
:: نستخدم الوسم [skip render] لتجنب البناء التلقائي على Render
git commit -m "[skip render] %msg%"

echo.
echo [3/3] جاري رفع الملفات إلى GitHub...
git push origin main

if %errorlevel% eq 0 (
    echo.
    echo ===================================================
    echo  تم الرفع بنجاح إلى GitHub وتخطي الـ Deploy في Render!
    echo ===================================================
) else (
    echo.
    echo [خطأ] حدثت مشكلة أثناء عملية الرفع.
    echo يرجى التأكد من اتصالك بالإنترنت وصلاحيات الوصول للمستودع.
)

:end
echo.
echo اضغط على أي مفتاح للخروج...
pause > nul

