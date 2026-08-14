# manually versioning v(n) --> V(n+1)

# 1. Make your code changes, then commit/push as usual
git add .
git commit -m "your change"
git push

# 2. Rebuild the image (picks up the new code from your local files)
docker build -t argo-suite:latest .

# 3. Remove the old container and volume, start fresh
docker rm -f argo-suite
docker volume rm argo_suite_data   # only if you want a clean DB too — see note below

# 4. Run it again
docker run -d --name argo-suite -p 8080:80 \
  -e JWT_SECRET="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" \
  -e DB_PASSWORD="something-strong" \
  -v argo_suite_data:/var/lib/postgresql/data \
  argo-suite:latest


Note on step 3: you only need to remove the volume if your code change involved a schema change (new table/column). For plain frontend/backend logic changes, you can skip docker volume rm — just remove and recreate the container, and your existing data (tickets, users) stays intact:

#bash

docker rm -f argo-suite
docker build -t argo-suite:latest .
docker run -d --name argo-suite -p 8080:80 \
  -e JWT_SECRET="..." -e DB_PASSWORD="..." \
  -v argo_suite_data:/var/lib/postgresql/data \
  argo-suite:latest