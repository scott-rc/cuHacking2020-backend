create table state (
    state_id int primary key,
    value text,
    createdAt timestamptz not null default current_timestamp,
    updatedAt timestamptz
);

insert into state (state_id, value)
values (1, 'todo'),
       (2, 'doing'),
       (3, 'done');

create table task (
    task_id bigserial primary key,
    title text not null,
    state_id int not null references state (state_id) default 1,
    createdAt timestamptz not null default current_timestamp,
    updatedAt timestamptz
);