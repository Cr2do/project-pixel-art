output "server_ip" {
  value = google_compute_address.server_ip.address
}

output "registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/reactive-pixel-board-registry"
}

output "github_action_sa_key" {
  value     = google_service_account_key.github_actions_key.private_key
  sensitive = true
}
