import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as core from '@actions/core';
import { exec, getExecOutput } from '@actions/exec';
import { fetchStats } from './github.js';
import { moodFor, stageFor } from './pet.js';
import { BACKGROUNDS, renderSvg, SPECIES, WINDOWS } from './render.js';

/* Read an input that must be one of a list */
function choice<T extends string>(name: string, allowed: readonly T[]): T {
  const value = core.getInput(name) as T;
  if (!allowed.includes(value)) {
    throw new Error(`Input "${name}" must be one of ${allowed.join(', ')}; got "${value}"`);
  }
  return value;
}

async function run() {
  /* Inputs */
  const token = core.getInput('github_token', { required: true });
  core.setSecret(token);
  const username = core.getInput('username', { required: true });
  const outputPath = core.getInput('output_path');
  const look = {
    species: choice('species', SPECIES),
    window: choice('window', WINDOWS),
    background: choice('background', BACKGROUNDS),
  };

  /* Activity → stage and mood */
  const stats = await fetchStats(
    token,
    username,
    core.getBooleanInput('include_private'),
    new Date(),
    process.env.GITHUB_GRAPHQL_URL,
  );
  const stage = stageFor(stats.total);
  const mood = moodFor(stats.daysSinceLast);
  core.info(`${stage}, ${mood}: ${stats.total} contributions, ${stats.streak}-day streak`);

  /* Draw and save */
  const svg = renderSvg({
    ...look,
    stage,
    mood,
    petName: core.getInput('pet_name'),
    stats,
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, svg);

  /* Commit if changed */
  if (!core.getBooleanInput('commit')) return;
  await exec('git', ['add', outputPath]);
  const unchanged = await getExecOutput('git', ['diff', '--cached', '--quiet'], {
    ignoreReturnCode: true,
  });
  if (unchanged.exitCode === 0) return core.info('No change to commit.');
  await exec('git', [
    '-c',
    'user.name=github-actions[bot]',
    '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit',
    '-m',
    core.getInput('commit_message'),
  ]);
  await exec('git', ['push']);
}

run().catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
