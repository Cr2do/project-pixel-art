provider "google" {
    project = var.project_id
    region  = var.region
}

resource "google_project_service" "apis" {
    for_each = toset([
        "container.googleapis.com",
        "artifactregistry.googleapis.com",
        "iam.googleapis.com",
        "secretmanager.googleapis.com",
    ])
    service = each.value
    disable_on_destroy = false
}

resource "google_artifact_registry_repository" "registry" {
    location = var.region
    repository_id = "reactive-pixel-board-registry"
    format = "DOCKER"
    description = "Artifact Registry for ${var.environment} environment"

    depends_on = [ google_project_service.apis ]
}

resource "google_container_cluster" "primary" {
    name     = var.cluster_name
    location = var.zone

    remove_default_node_pool = true
    initial_node_count       = 1
    deletion_protection      = false

    depends_on = [ google_project_service.apis ]
}

resource "google_container_node_pool" "primary_nodes" {
    name     = "${var.cluster_name}-node-pool"
    location = var.zone
    cluster  = google_container_cluster.primary.name

    node_config {
        machine_type = "e2-medium"
        oauth_scopes = [
            "https://www.googleapis.com/auth/cloud-platform",
        ]
        labels = {
            environment = var.environment
        }
    }

    autoscaling {
      min_node_count = 1
      max_node_count = 2
    }

    management {
      auto_repair = true
      auto_upgrade = true
    }

}


resource "google_compute_address" "api_ip" {
    name   = "pixel-board-api-ip"
    region = var.region

    depends_on = [ google_project_service.apis ]
}

resource "google_compute_address" "client_ip" {
    name   = "pixel-board-client-ip"
    region = var.region

    depends_on = [ google_project_service.apis ]
}

resource "google_service_account" "github_actions" {
    account_id = "github-actions-sa"
    display_name = "GitHub Actions Service Account"
}

resource "google_service_account_key" "github_actions_key" {
    service_account_id = google_service_account.github_actions.name
}

resource "google_project_iam_member" "github_actions_roles" {
    for_each = toset([
        "roles/container.developer",
        "roles/artifactregistry.writer"
    ])

    project = var.project_id
    role = each.value
    member = "serviceAccount:${google_service_account.github_actions.email}"
}
