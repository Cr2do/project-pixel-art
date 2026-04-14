
output "cluster_name" {
  value = google_container_cluster.primary.name
}

output "api_external_ip" {
  value = google_compute_address.api_ip.address
}

output "client_external_ip" {
  value = google_compute_address.client_ip.address
}

output "registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/reactive-pixel-board-registry"
}

output "github_action_sa_key" {
  value     = google_service_account_key.github_actions_key.private_key
  sensitive = true
}
