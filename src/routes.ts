import { Router } from 'express';
import { exercises, getExercise, getAssetUrl, searchExercises } from '@bryllim/workout-guide';
import type { Exercise, ExerciseSearchFilters } from '@bryllim/workout-guide';

const router = Router();

type FrameWithUrl = Exercise['frames'][number] & { imgUrl: string };
type ExerciseWithUrl = Omit<Exercise, 'frames'> & { frames: [FrameWithUrl, FrameWithUrl, FrameWithUrl] };

function withImageUrls(src: Exercise[], baseUrl: string): ExerciseWithUrl[] {
  return src.map((exercise) => ({
    ...exercise,
    frames: exercise.frames.map((frame) => ({
      ...frame,
      imgUrl: getAssetUrl(exercise.slug, frame.index, { baseUrl }),
    })),
  })) as ExerciseWithUrl[];
}

function requestBaseUrl(req: { protocol: string; get(name: string): string | undefined }): string {
  return `${req.protocol}://${req.get('host')}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function formatQuery(value: unknown): string | undefined {
  if (Array.isArray(value)) return String(value[0]);
  if (typeof value === 'string') return value;
  return undefined;
}

router.get('/exercises', (req, res) => {
  res.json({
    count: exercises.length,
    results: withImageUrls(exercises, requestBaseUrl(req)),
  });
});

router.get('/exercises/search', (req, res) => {
  const query = formatQuery(req.query.q);
  const rawFilters: Record<string, unknown> = {
    equipment: formatQuery(req.query.equipment),
    primaryMuscle: formatQuery(req.query.primaryMuscle),
    exerciseType: formatQuery(req.query.exerciseType),
  };

  const filters = Object.fromEntries(
    Object.entries(rawFilters).filter(([, value]) => value !== undefined),
  ) as ExerciseSearchFilters;

  const results = Object.keys(filters).length > 0 || query
    ? searchExercises(query, filters)
    : exercises;

  res.json({ query: query ?? null, count: results.length, results: withImageUrls(results, requestBaseUrl(req)) });
});

router.get('/exercises/muscle/:muscle', (req, res) => {
  const muscle = normalize(req.params.muscle);
  if (!muscle) {
    res.status(400).json({ error: 'El parámetro "muscle" es obligatorio.' });
    return;
  }

  const results = exercises.filter(
    (exercise) =>
      normalize(exercise.primaryMuscle) === muscle ||
      exercise.secondaryMuscles.some((secondary) => normalize(secondary) === muscle),
  );

  res.json({
    muscle: req.params.muscle,
    count: results.length,
    results: withImageUrls(results, requestBaseUrl(req)),
  });
});

router.get('/muscles', (_req, res) => {
  const counts = new Map<string, number>();
  for (const exercise of exercises) {
    counts.set(exercise.primaryMuscle, (counts.get(exercise.primaryMuscle) ?? 0) + 1);
  }

  const muscles = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ count: muscles.length, muscles });
});

router.get('/exercises/:idOrSlug', (req, res) => {
  const exercise = getExercise(req.params.idOrSlug);
  if (!exercise) {
    res.status(404).json({ error: `Ejercicio "${req.params.idOrSlug}" no encontrado.` });
    return;
  }
  res.json(withImageUrls([exercise], requestBaseUrl(req))[0]);
});

export { router };