# Feature: User Authentication & Login

## Target URL
`https://example.com/login`

## Overview
Users should be able to log in to their account using valid credentials, receive clear error messages for invalid attempts, and access the password recovery page if needed.

## User Scenarios

### Scenario 1: Successful Login with Valid Credentials
- **Given** user is on the login page (`/login`)
- **When** user enters valid username `testuser@example.com`
- **And** user enters valid password `Password123!`
- **And** user clicks the "Sign In" button
- **Then** user should be redirected to the dashboard (`/dashboard`)
- **And** user should see a welcome banner with their name

### Scenario 2: Unsuccessful Login with Invalid Password
- **Given** user is on the login page (`/login`)
- **When** user enters valid username `testuser@example.com`
- **And** user enters incorrect password `WrongPassword!`
- **And** user clicks the "Sign In" button
- **Then** user should remain on the login page
- **And** user should see an error message "Invalid credentials provided"

### Scenario 3: Required Field Validation
- **Given** user is on the login page (`/login`)
- **When** user clicks the "Sign In" button without entering credentials
- **Then** field validation warnings should display for username and password fields
