Add-Type -AssemblyName System.Drawing

$output = 'C:\Users\marce\Documents\Codi\architecture\red-fisica-hibrida.png'
$bitmap = New-Object System.Drawing.Bitmap 1800, 850
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::White)

$font = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font('Arial', 18)
$sectionFont = New-Object System.Drawing.Font('Arial', 20, [System.Drawing.FontStyle]::Bold)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(36, 64, 91), 5)
$arrowCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(8, 8)
$pen.CustomEndCap = $arrowCap

function Draw-Box($x, $y, $width, $height, $title, $subtitle, $color) {
    $brush = New-Object System.Drawing.SolidBrush($color)
    $border = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(36, 64, 91), 3)
    $graphics.FillRectangle($brush, $x, $y, $width, $height)
    $graphics.DrawRectangle($border, $x, $y, $width, $height)
    $graphics.DrawString($title, $font, [System.Drawing.Brushes]::White, $x + 18, $y + 20)
    $graphics.DrawString($subtitle, $smallFont, [System.Drawing.Brushes]::White, $x + 18, $y + 70)
    $brush.Dispose()
    $border.Dispose()
}

$graphics.DrawString('Zona local de la E.E.T. N. 3117', $sectionFont, [System.Drawing.Brushes]::DarkGreen, 70, 55)
$graphics.DrawString('Zona externa / acceso hibrido', $sectionFont, [System.Drawing.Brushes]::DarkBlue, 1260, 55)
$graphics.DrawLine((New-Object System.Drawing.Pen([System.Drawing.Color]::LightGray, 3)), 1190, 30, 1190, 790)

Draw-Box 70 250 300 170 'PC de alumnos' 'Navegador en aula' ([System.Drawing.Color]::FromArgb(46, 125, 50))
Draw-Box 500 250 260 170 'Switch' 'UTP / RJ45' ([System.Drawing.Color]::FromArgb(0, 121, 107))
Draw-Box 870 180 280 170 'Servidor EVA' 'Local - examenes' ([System.Drawing.Color]::FromArgb(198, 40, 40))
Draw-Box 870 470 280 170 'Router' 'Salida controlada' ([System.Drawing.Color]::FromArgb(94, 53, 177))
Draw-Box 1320 250 360 170 'Codi' 'Acceso hibrido - hogar/aula' ([System.Drawing.Color]::FromArgb(21, 101, 192))

$graphics.DrawLine($pen, 370, 335, 500, 335)
$graphics.DrawLine($pen, 760, 335, 870, 275)
$graphics.DrawLine($pen, 1010, 350, 1010, 470)
$graphics.DrawLine($pen, 1150, 555, 1320, 335)

$graphics.DrawString('LAN institucional', $smallFont, [System.Drawing.Brushes]::Black, 385, 290)
$graphics.DrawString('Servicio local', $smallFont, [System.Drawing.Brushes]::Black, 765, 245)
$graphics.DrawString('Internet / HTTPS', $smallFont, [System.Drawing.Brushes]::Black, 1180, 450)
$graphics.DrawString('EVA permanece local; Codi puede utilizarse desde la escuela o desde el hogar.', $smallFont, [System.Drawing.Brushes]::Black, 420, 740)

$bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
$font.Dispose()
$smallFont.Dispose()
$sectionFont.Dispose()
$pen.Dispose()
$arrowCap.Dispose()
