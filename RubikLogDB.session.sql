-- Display all columns and rows from tracker_solve table
SELECT *
FROM tracker_solve;
-- For more detailed information about the table structure:
SELECT column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tracker_solve'
ORDER BY ordinal_position;