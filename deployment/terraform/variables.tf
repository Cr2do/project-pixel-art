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

variable "cluster_name" {
    description = "PIXEL BOARD TP Cluster Name"
    type        = string
    default = "pixel-board-cluster"
}

variable "environment" {
    description = "PIXEL BOARD TP Environment"
    type        = string
    default = "develop"
}
