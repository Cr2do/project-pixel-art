{{/*
API image full reference
*/}}
{{- define "pixel-board.apiImage" -}}
{{- printf "%s/%s/%s/api:%s" .Values.image.registry .Values.image.project .Values.image.repository .Values.image.tag }}
{{- end }}

{{/*
Client image full reference
*/}}
{{- define "pixel-board.clientImage" -}}
{{- printf "%s/%s/%s/client:%s" .Values.image.registry .Values.image.project .Values.image.repository .Values.image.tag }}
{{- end }}

{{/*
MongoDB connection URI
*/}}
{{- define "pixel-board.mongoUri" -}}
{{- printf "mongodb://%s:%s@mongodb:27017/%s?authSource=admin" .Values.mongodb.rootUsername .Values.mongodb.rootPassword .Values.mongodb.database }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "pixel-board.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
