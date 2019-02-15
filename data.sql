

CREATE TABLE vehicles (
    ID int NOT NULL PRIMARY KEY,
    knr varchar(50) NOT NULL,
    aggregate varchar(20),
	seats INT NOT NULL,
	creation_date DATE,
	order_status varchar(10),
	order_version INT,
	order_plant INT,
	foreign_dealer INT,
	vehicle_series VARCHAR(10),
	vehicle_status VARCHAR(20),
	color VARCHAR(10),
	color_exernal VARCHAR(10),
	color_roof VARCHAR(10),
	color_internal VARCHAR(10),
	gear_type VARCHAR(10),
	gro_hnd_land VARCHAR(10),
	komm_nr VARCHAR(10),
	countries VARCHAR(50),
	pin VARCHAR(50),
	schaugl_wo INT,
	tm VARCHAR(10),
	target_station INT
);




INSERT INTO vehicles values(1,'3044070 (22-2018)', 'NY', 5, '2018-07-26', 'G000',02, 22, null, '8W', 'G000', 'H1H1', 'H1', 'H1', 'ZI', 'TBR', 'UV', 'SH2631', 'USA','3044070 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(2,'3044071 (22-2018)', 'MG', 5, '2018-07-26', 'G000',02, 22, null, '8W', 'G000', 'T9T9', 'T9', 'T9', 'ZI', 'SVL', 'UH', 'ST2797', 'USA', '3044071 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(3,'3044072 (22-2018)', 'NY', 5, '2018-07-26', 'G000',02, 22, null, '8W', 'G000', '0C0C', '0C', '0C', 'YM', 'TBR', 'UV', 'SH4178', 'USA', '3044072 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(4,'3044157 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F000', 'A2A2', 'A2', 'A2', 'ZI', 'TBR', 'UQ', 'SH4945', 'USA', '3044157 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(5,'3044159 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F000', '2Y2Y', '2Y', '2Y', 'AR', 'TBR', 'UV', 'SH2627', 'USA', '3044159 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(6,'3044164 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'H1H1', 'H1', 'H1', 'AR', 'TBR', 'UQ', 'SQ9706', 'USA', '3044164 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(7,'3044165 (22-2018)', 'MG', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'H1H1', 'H1', 'H1', 'YM', 'SVL', 'UQ', 'ST2485', 'USA', '3044165 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(8,'3044166 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'H1H1', 'H1', 'H1', 'YM', 'TBR', 'UV', 'SH4420', 'USA', '3044166 (22-2018)', 201830, '8W', null);	
INSERT INTO vehicles values(9,'3044167 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'A2A2', 'A2', 'A2', 'YM', 'TBR', 'UV', 'SH0728', 'USA', '3044167 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(10,'3044168 (22-2018)', 'MG', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'T9T9', 'T9', 'T9', 'ZK', 'SVL', 'UH', 'ST2828', 'USA', '3044168 (22-2018)', 201830, '8W', null);
INSERT INTO vehicles values(11,'3044169 (22-2018)', 'NY', 5, '2018-07-26', 'F000',03, 22, null, '8W', 'F100', 'L5L5', 'L5', 'L5', 'YM', 'TBR', 'UV', 'SE3308', 'USA', '3044169 (22-2018)', 201830, '8W', null);
