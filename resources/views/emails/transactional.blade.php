<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $heading }}</title>
    <style>
        @media only screen and (max-width: 620px) {
            .email-shell { width: 100% !important; }
            .email-outer { padding: 16px 10px !important; }
            .email-content { padding: 30px 24px !important; }
            .email-heading { font-size: 33px !important; }
            .email-brand { padding: 26px 24px !important; }
            .email-button { display: block !important; padding: 16px !important; }
            .email-footer { padding: 24px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2eb;color:#36543d;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{{ $preheader }}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0f2eb;">
<tr><td align="center" class="email-outer" style="padding:40px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-shell" style="width:600px;max-width:600px;background-color:#fffefa;border:1px solid #dce4d1;border-radius:10px;overflow:hidden;">
    <tr><td style="height:4px;background-color:#c5aa65;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td class="email-brand" style="padding:31px 40px;background-color:#073e32;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#e8d496;font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:3px;line-height:1;">USK</td><td align="right" style="color:#d9e5ce;font-size:10px;line-height:1.8;">UNIVERSITÉ SIMON KIMBANGU<br><span style="color:#b7c8a8;font-size:8px;letter-spacing:1px;">SCIENCE · CONSCIENCE · VÉRITÉ</span></td></tr></table>
    </td></tr>
    <tr><td class="email-content" style="padding:40px;">
        <p style="margin:0 0 19px;color:#a38b4e;font-size:9px;font-weight:bold;letter-spacing:1.5px;line-height:1.8;">{{ $eyebrow }}</p>
        <h1 class="email-heading" style="margin:0 0 28px;color:#214c32;font-family:Georgia,'Times New Roman',serif;font-size:39px;font-weight:normal;line-height:1.15;">{{ $heading }}</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.9;color:#36543d;">Bonjour {{ $recipientName }},</p>
        @foreach($paragraphs as $paragraph)
            <p style="margin:0 0 19px;font-size:14px;line-height:1.9;color:#66765c;">{{ $paragraph }}</p>
        @endforeach
        @if(!empty($details))
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;background-color:#f3f6eb;border:1px solid #e1e8d6;border-radius:6px;">
            @foreach($details as $label => $value)
            <tr><td style="padding:13px 16px;border-bottom:1px solid #e5ebdc;font-size:11px;color:#637653;vertical-align:top;width:37%;">{{ $label }}</td><td style="padding:13px 16px;border-bottom:1px solid #e5ebdc;font-size:12px;line-height:1.7;color:#4a6a3d;word-break:break-word;">{{ $value }}</td></tr>
            @endforeach
        </table>
        @endif
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:29px 0;width:100%;"><tr><td align="left"><a class="email-button" href="{{ $actionUrl }}" style="display:inline-block;background-color:#073e32;border:1px solid #073e32;border-radius:5px;padding:16px 24px;color:#fffefa;font-size:13px;font-weight:bold;line-height:1.5;text-decoration:none;mso-padding-alt:16px 24px;">{{ $actionLabel }}</a></td></tr></table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f4e8;border-left:3px solid #c7ae70;"><tr><td style="padding:18px 20px;"><strong style="font-size:12px;font-weight:bold;color:#8a7543;">{{ $noticeTitle }}</strong><p style="margin:8px 0 0;font-size:12px;line-height:1.9;color:#6d7257;">{{ $notice }}</p></td></tr></table>
        <p style="margin:29px 0 0;font-size:13px;line-height:1.9;color:#71815f;">Bien cordialement,<br><strong style="font-weight:bold;color:#4e6b3f;">{{ $signature }}</strong><br>Université Simon Kimbangu</p>
    </td></tr>
    <tr><td class="email-footer" style="padding:25px 40px;background-color:#f4f6ee;border-top:1px solid #e0e7d5;">
        <p style="margin:0 0 10px;font-size:11px;line-height:1.9;color:#687a58;">Une question ? <a href="mailto:contact@universitesk.net" style="color:#607e4a;text-decoration:underline;">contact@universitesk.net</a><br>N° 44, avenue Bongolo, Kauka, Kalamu · Kinshasa, RDC</p>
        <p style="margin:0;font-size:10px;line-height:1.9;color:#6f7d60;">Cet email automatique accompagne vos démarches auprès de l’USK.<br><a href="{{ url('/contact') }}" style="color:#81976d;text-decoration:underline;">Contacter l’université</a> &nbsp;·&nbsp; <a href="{{ url('/') }}" style="color:#81976d;text-decoration:underline;">Visiter le site</a></p>
    </td></tr>
</table>
<table role="presentation" width="600" class="email-shell" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;"><tr><td style="padding:22px 18px;font-size:10px;line-height:1.8;color:#697b59;word-break:break-all;overflow-wrap:anywhere;">
Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="{{ $actionUrl }}" style="color:#7f956b;text-decoration:underline;">{{ $actionUrl }}</a>
</td></tr></table>
</td></tr></table>
</body>
</html>
