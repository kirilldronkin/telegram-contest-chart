<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Telegram Contest</title>

		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

		<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">

		%STYLES%
	</head>
	<body class=_loading>
		<script type="text/javascript">
			document.body.classList.add('_' +  window.localStorage.getItem('telegram-contest-chart_theme') || 'day');
		</script>

		<div id="panes"></div>
		<div id="theme-switch-button"></div>

		<a id="repo-link" href="https://github.com/kirilldronkin/telegram-contest-chart" target="_blank">
			View on GitHub
		</a>

		%SCRIPTS%
	</body>
</html>
