/* dont modify built in functionality */
const push = document.querySelector("[data-push='push']");
const sidebar = document.querySelector(".sidebar");
const mainbody = document.querySelector(".mainbody");

/* leftbar toggling */
push.addEventListener("click", () => {
	sidebar.classList.toggle("off");
	mainbody.classList.toggle("off");
	if (screen.width >= 768 && screen.width < 970) {
		document.querySelectorAll(".sidetoggle").forEach((st) => {
			st.classList.toggle("on");
			st.children[0].classList.add("plus");

			document.querySelector(".logo-sm").style.display = "none";
			document.querySelector(".logo-lg").style.display = "block";
		});
	}
});

/* reset the layout */
if (screen.width < 768 || (screen.width >= 768 && screen.width < 970)) {
	document.querySelectorAll(".sidetoggle").forEach((col) => {
		col.children[0].classList.remove("plus");
		document.querySelector(".logo-lg").style.display = "none";
		document.querySelector(".logo-sm").style.display = "block";
	});
}

window.addEventListener("click", (e) => {
	if (screen.width < 768 || (screen.width >= 768 && screen.width < 970)) {
		if (
			e.target !== sidebar &&
			!e.target.closest(".sidebar .topbar") &&
			!e.target.closest("[data-bs-toggle='collapse']") &&
			!e.target.matches("[data-push='push']")
		) {
			sidebar.classList.remove("off");
			mainbody.classList.remove("off");
			sidebar.classList.remove("on");
			mainbody.classList.remove("on");

			document.querySelectorAll(".sidetoggle").forEach((st) => {
				st.classList.remove("on");
				st.children[0].classList.remove("plus");
			});
			document.querySelectorAll(".sidebar .collapse").forEach((col) => {
				col.classList.remove("show");
			});
			document.querySelector(".logo-lg").style.display = "none";
			document.querySelector(".logo-sm").style.display = "block";
		}
	}
});

/* caret animation and 768 to 970 range sidetoggle */
const onoff = document.querySelectorAll("[data-show='onoff']");
onoff.forEach((col) => {
	col.onclick = (_e) => {
		if (screen.width >= 768 && screen.width < 970) {
			sidebar.classList.add("off");
			mainbody.classList.add("off");

			document.querySelectorAll(".sidetoggle").forEach((st) => {
				st.classList.add("on");
			});
		}
	};
});

/* for header anchor click active class */
const headeranchor = document.querySelectorAll(".mainbody header ul li");
headeranchor.forEach((ha) => {
	ha.onclick = (e) => {
		headeranchor.forEach((h) => {
			h.classList.remove("active");
		});
		e.currentTarget.classList.add("active");
	};
});

const anchor = document.querySelectorAll(".sidebar ul li");
anchor.forEach((act) => {
	act.onclick = (e) => {
		anchor.forEach((list) => {
			list.classList.remove("active");
		});
		e.currentTarget.classList.add("active");
	};
});

const anchorsub = document.querySelectorAll(".sidebar ul li > ul li");
anchorsub.forEach((sub) => {
	sub.onclick = (e) => {
		anchorsub.forEach((sublist) => {
			sublist.classList.remove("subactive");
		});
		e.currentTarget.classList.add("subactive");
	};
});

/*
 * responsive vertical table for admin panel
 */
const dd = document.querySelectorAll(".table-vertical > tbody > tr");
dd.forEach((el) => {
	const btn = el.querySelector(
		".table-vertical > tbody > tr [data-toggle='custom-dropdown']",
	);
	const td = el.querySelectorAll(".table-vertical > tbody > tr [data-body]");
	btn.onclick = () => {
		td.forEach((el) => {
			el.classList.toggle("on");
		});
	};
});

/*
 * all checkbox checked or unchecked posts and pages
 */
const chkhead = document.querySelectorAll(".table-vertical .chkgrp");
const allchk = document.querySelectorAll(
	".table-vertical input[type='checkbox']",
);
chkhead.forEach((ch) => {
	ch.onclick = () => {
		allchk.forEach((el) => {
			if (!ch.checked) {
				el.checked = "";
			} else {
				el.checked = "checked";
			}
		});
	};
});
