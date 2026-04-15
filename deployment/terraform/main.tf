provider "google" {
    project = var.project_id
    region  = var.region
}

resource "google_project_service" "apis" {
    for_each = toset([
        "compute.googleapis.com",
        "artifactregistry.googleapis.com",
        "iam.googleapis.com",
    ])
    service            = each.value
    disable_on_destroy = false
}

# ── Artifact Registry ────────────────────────────────────
resource "google_artifact_registry_repository" "registry" {
    location      = var.region
    repository_id = "reactive-pixel-board-registry"
    format        = "DOCKER"
    description   = "Artifact Registry for ${var.environment} environment"

    depends_on = [google_project_service.apis]
}

# ── IP statique du serveur ───────────────────────────────
resource "google_compute_address" "server_ip" {
    name   = "pixel-board-server-ip"
    region = var.region

    depends_on = [google_project_service.apis]
}

# ── Firewall ─────────────────────────────────────────────
resource "google_compute_firewall" "allow_http" {
    name    = "pixel-board-allow-http"
    network = "default"

    allow {
        protocol = "tcp"
        ports    = ["80", "8000"]
    }

    target_tags   = ["pixel-board"]
    source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_ssh" {
    name    = "pixel-board-allow-ssh"
    network = "default"

    allow {
        protocol = "tcp"
        ports    = ["22"]
    }

    target_tags   = ["pixel-board"]
    source_ranges = ["0.0.0.0/0"]
}

# ── VM ───────────────────────────────────────────────────
resource "google_compute_instance" "server" {
    name         = "pixel-board-server"
    machine_type = "e2-standard-4"
    zone         = var.zone

    tags = ["pixel-board"]

    boot_disk {
        initialize_params {
            image = "debian-cloud/debian-12"
            size  = 20
        }
    }

    network_interface {
        network = "default"
        access_config {
            nat_ip = google_compute_address.server_ip.address
        }
    }

    metadata = {
        ssh-keys = "deploy:${var.ssh_public_key}"
    }

    metadata_startup_script = <<-EOT
        #!/bin/bash
        set -e

        # Install Docker
        apt-get update -y
        apt-get install -y ca-certificates curl
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
        chmod a+r /etc/apt/keyrings/docker.asc
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
            tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

        systemctl enable docker
        systemctl start docker

        # Créer l'utilisateur deploy
        useradd -m -s /bin/bash deploy
        usermod -aG docker deploy

        # Configure l'auth Artifact Registry pour deploy
        su -s /bin/bash deploy -c \
          "gcloud auth configure-docker europe-west1-docker.pkg.dev --quiet"

        # Répertoire de l'application
        mkdir -p /home/deploy/docker
        chown -R deploy:deploy /home/deploy/docker
    EOT

    service_account {
        email  = google_service_account.github_actions.email
        scopes = ["cloud-platform"]
    }

    depends_on = [google_project_service.apis]
}

# ── Service Account GitHub Actions ───────────────────────
resource "google_service_account" "github_actions" {
    account_id   = "github-actions-sa"
    display_name = "GitHub Actions Service Account"
}

resource "google_service_account_key" "github_actions_key" {
    service_account_id = google_service_account.github_actions.name
}

resource "google_project_iam_member" "github_actions_roles" {
    for_each = toset([
        "roles/artifactregistry.writer",
    ])

    project = var.project_id
    role    = each.value
    member  = "serviceAccount:${google_service_account.github_actions.email}"
}
