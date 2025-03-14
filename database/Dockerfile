FROM mongo:latest

# Copy the import script and data files
COPY import.sh /docker-entrypoint-initdb.d/
COPY data/ /docker-entrypoint-initdb.d/data/

# Ensure the import script is executable
RUN chmod +x /docker-entrypoint-initdb.d/import.sh

EXPOSE 27017