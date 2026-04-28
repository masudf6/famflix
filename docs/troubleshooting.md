Useful k8s commands for toubleshooting

kubectl get all -n famflix
kubectl get pods -n famflix
kubectl get svc -n famflix
kubectl get ingress -n famflix
kubectl get events -n famflix --sort-by=.lastTimestamp

kubectl logs deployment/backend -n famflix
kubectl logs deployment/frontend -n famflix
kubectl logs deployment/postgres -n famflix

kubectl describe pod <pod-name> -n famflix
kubectl describe deployment/backend -n famflix
kubectl describe ingress -n famflix

kubectl rollout status deployment/backend -n famflix
kubectl rollout history deployment/backend -n famflix
kubectl rollout undo deployment/backend -n famflix
