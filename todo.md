Allow student to review faculties.

. the admin will trigger a function which will show a popup to the students to rate the faculties. 
. it will be intact in the notification section without the delete button on it and it will have a 3 days window. 
. after 3 days it will be removed from the notification section and the student will not be able to rate the faculties.
. the popup will also have a button to do it later. if the student clicks on it, the popup will be closed and will be kept in the notification section for the remaining time.
. in the popup, only those faculties will be listed who actually teach the students. (it will be fetched from the student's batch information)
. student will be allowed to fill the rating only once. if the rating is filled, the form will be submitted and will be removed from the notification section.
. after the form will be inaccessible from the students, the rating calculation will be performed and the total updated rating will be shown to the admin.
. the new calculated ratings will overwrite the old ratings. there will be no rating history.

Student rating: since it is already made through only frontend logic that the faculty will rate the 4 performence measure of the student in his subject. the attandnance rating will be self calculated from the attandnance. and the other ratings will be edited by the faculty. so make it functional. we have a table in database for rating. you can restructure the table if needed. also save the remarks given by the faculty. the remarks given by the admin will directly store in the students table i guess. also reflect the rating in the student's profile in the dedicated section provided. ask me if you want help with anything.

show the actual test performence in the student details/test performance summery section. fetch the details from the test the student was shown(can be fetch by the batch information) ask me if you need any information