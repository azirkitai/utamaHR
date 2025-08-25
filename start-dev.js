#!/usr/bin/env node
// Simple development starter script for UtamaHR
import { spawn } from 'child_process';
import process from 'process';

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nGracefully shutting down...');
  server.kill('SIGTERM');
});