@echo off
chcp 65001 >nul
title Tech Go — ZKTeco Fingerprint Server
color 0b
cls
echo ======================================================================
echo    Tech Go System -- سيرفر ربط ماكينة البصمة التلقائي
echo ======================================================================
echo.
python zk_adms_server.py
pause
