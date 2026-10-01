// The initial legacy copy was a one-time operation; it omits v2 people and migration state.
console.error('Legacy staging seeding is retired. Production now uses main. Use a complete dataset export/import for future copies; see docs/sanity-main-promotion.md.');
process.exitCode = 1;
