#!/bin/bash
cd /Users/yarno/Documents/Programming/Private/3D-Printed-Roermond/backend
mvn exec:java -Dexec.mainClass="nl.embediq.woocommerce.PasswordHashGenerator" -Dexec.cleanupDaemonThreads=false 2>&1 | grep -E "(Password:|BCrypt Hash:|Hash verification:)"

