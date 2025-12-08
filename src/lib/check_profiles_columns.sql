select column_name 
from information_schema.columns 
where table_name = 'profiles' 
and column_name in ('phone_number', 'address', 'nhs_number');
