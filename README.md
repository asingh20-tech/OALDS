# OALDS
Project Description:
Overview

OALDS (Orbital Asset & Launch Display System) is a full stack web application for tracking and visualizing rocket launches in real time on an interactive 3D globe. The system combines a normalized PostgreSQL database, a Django backend with a custom REST API, and a Three.js frontend that renders Earth, country borders, launch site pins, and animated rocket trajectories. The administrative interface allows authorized users to add, edit, and delete launch sites, rockets, missions, payloads, boosters, and booster flight records, with all changes immediately reflected on the live globe through the API.

Project Goals

The primary goal of this project was to practice end to end database management system design and implementation, with a focus on:

Designing a relational schema for a real world domain (space launches) with multiple entities and relationships
Normalizing the schema to Third Normal Form (3NF) to eliminate redundancy and update anomalies
Implementing the schema in PostgreSQL using SQL DDL
Building a backend that exposes the database to a frontend through a clean API layer
Creating an interface (both an admin panel for data entry and a frontend visualization for end users) that showcases the data.
