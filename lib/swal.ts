import Swal from "sweetalert2";

// ─── Toast (non-blocking feedback) ───────────────────────────────────────────

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: "swal-toast",
  },
});

// ─── Confirm: aksi destruktif (hapus, batalkan, reset) ───────────────────────

export async function confirmDestroy(options?: {
  title?: string;
  description?: string;
  confirmLabel?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    title: options?.title ?? "Yakin ingin menghapus?",
    text: options?.description ?? "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options?.confirmLabel ?? "Ya, Hapus",
    cancelButtonText: "Batal",
    customClass: {
      confirmButton: "swal-btn-danger",
      cancelButton: "swal-btn-cancel",
      popup: "swal-popup",
      title: "swal-title",
    },
    buttonsStyling: false,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

// ─── Confirm: aksi umum / form submission ────────────────────────────────────

export async function confirmAction(options?: {
  title?: string;
  description?: string;
  confirmLabel?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    title: options?.title ?? "Konfirmasi",
    text: options?.description ?? "Apakah Anda yakin ingin melanjutkan?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: options?.confirmLabel ?? "Ya, Lanjutkan",
    cancelButtonText: "Batal",
    customClass: {
      confirmButton: "swal-btn-primary",
      cancelButton: "swal-btn-cancel",
      popup: "swal-popup",
      title: "swal-title",
    },
    buttonsStyling: false,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

// ─── Feedback: sukses (toast) ─────────────────────────────────────────────────

export function alertSuccess(message: string, title = "Berhasil!") {
  return Toast.fire({
    icon: "success",
    title,
    text: message,
  });
}

// ─── Feedback: error (toast) ──────────────────────────────────────────────────

export function alertError(message: string, title = "Gagal!") {
  return Toast.fire({
    icon: "error",
    title,
    text: message,
  });
}

// ─── Feedback: info (toast) ───────────────────────────────────────────────────

export function alertInfo(message: string, title = "Info") {
  return Toast.fire({
    icon: "info",
    title,
    text: message,
  });
}

// ─── Loading state (blocking) ─────────────────────────────────────────────────

export function alertLoading(message = "Sedang memproses...") {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    customClass: {
      popup: "swal-popup",
      title: "swal-title",
    },
    didOpen: () => Swal.showLoading(),
  });
}

export function alertClose() {
  Swal.close();
}
