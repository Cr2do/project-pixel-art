variable "project_id" {
    description = "PIXEL BOARD TP Project"
    type        = string
    default     = "react-project-493212"
}

variable "region" {
    description = "PIXEL BOARD TP Region"
    type        = string
    default     = "europe-west1"
}

variable "zone" {
    description = "PIXEL BOARD TP Zone"
    type        = string
    default     = "europe-west1-b"
}

variable "environment" {
    description = "PIXEL BOARD TP Environment"
    type        = string
    default     = "develop"
}

variable "ssh_public_key" {
    description = "Clé SSH publique pour l'utilisateur deploy sur la VM"
    type        = string
}
