const fs = require('fs');
try {
  const content = fs.readFileSync('students_rows.sql', 'utf8');
  const updated = content
    .replace(/INSERT INTO "public"\."students"/g, 'INSERT INTO public.students_registry')
    .replace(/"name"/g, '"full_name"');
  fs.writeFileSync('import_253_students_registry.sql', updated);
  console.log('Successfully created import_253_students_registry.sql');
} catch (err) {
  console.error('Error:', err);
}
