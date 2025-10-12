import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';

void showToast({
  required String title,
  required String message,
  required ToastificationType type,
  Duration? autoCloseDuration,
}) {
  toastification.show(
    type: type,
    style: ToastificationStyle.flatColored,
    title: Text(title),
    description: Text(message),
    alignment: Alignment.bottomCenter,
    autoCloseDuration: autoCloseDuration ?? const Duration(seconds: 5),
    borderRadius: BorderRadius.circular(100.0),
  );
}

void showToastError(String title, String message) {
  showToast(title: title, message: message, type: ToastificationType.error);
}

void showToastWarning(String title, String message) {
  showToast(title: title, message: message, type: ToastificationType.warning);
}

void showToastSuccess(String title, String message) {
  showToast(title: title, message: message, type: ToastificationType.success);
}
